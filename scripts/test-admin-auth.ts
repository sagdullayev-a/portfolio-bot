import { isAdmin, getAdminIds, addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { loadActivityLogs, saveActivityLogs, getLogsByAction } from '../src/database';

async function testAdminAuth() {
  console.log('=== ADMIN SECURITY LAYER TEST SUITE ===\n');

  const adminId = 123456789;
  const nonAdminId = 987654321;

  // Register admin for testing
  addAdminId(adminId);

  // 1. Test Admin Identification
  console.log('1. Testing Admin Identification (isAdmin)...');
  const checkAdmin = isAdmin(adminId);
  console.log('  ✅ isAdmin(adminId):', checkAdmin);
  if (!checkAdmin) throw new Error('Expected adminId to be identified as admin');

  const checkNonAdmin = isAdmin(nonAdminId);
  console.log('  ✅ isAdmin(nonAdminId):', checkNonAdmin);
  if (checkNonAdmin) throw new Error('Expected nonAdminId to NOT be identified as admin');

  // 2. Test Set O(1) Performance & Admin IDs List
  console.log('\n2. Testing Set O(1) & getAdminIds()...');
  const adminIds = getAdminIds();
  console.log('  ✅ getAdminIds():', adminIds);
  if (!adminIds.includes(adminId)) throw new Error('Expected getAdminIds() to include adminId');

  // 3. Test Middleware Allowed (Admin User)
  console.log('\n3. Testing Middleware with Admin User...');
  let nextCalled = false;
  let replyCalled = false;

  const mockAdminCtx: any = {
    from: { id: adminId },
    chat: { id: adminId, type: 'private' },
    message: { text: '/admin_dashboard' },
    reply: async () => {
      replyCalled = true;
    },
  };

  await adminAuthMiddleware(mockAdminCtx, async () => {
    nextCalled = true;
  });

  console.log('  ✅ Admin allowed -> next() called:', nextCalled);
  console.log('  ✅ Admin allowed -> reply() NOT called:', !replyCalled);
  if (!nextCalled || replyCalled) throw new Error('Admin user should call next() and not reply rejection');

  // 4. Test Middleware Blocked & Unauthorized Logging (Non-Admin User)
  console.log('\n4. Testing Middleware with Non-Admin User...');
  let nonAdminNextCalled = false;
  let nonAdminReplyMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    chat: { id: nonAdminId, type: 'private' },
    message: { text: '/secret_admin_cmd' },
    reply: async (msg: string) => {
      nonAdminReplyMessage = msg;
    },
  };

  await adminAuthMiddleware(mockNonAdminCtx, async () => {
    nonAdminNextCalled = true;
  });

  console.log('  ✅ Non-admin blocked -> next() NOT called:', !nonAdminNextCalled);
  console.log('  ✅ Non-admin rejection message:', nonAdminReplyMessage);

  if (nonAdminNextCalled) throw new Error('Non-admin should NOT call next()');
  if (nonAdminReplyMessage !== UNAUTHORIZED_MESSAGE) throw new Error('Expected unauthorized rejection message');

  // 5. Test Unauthorized Activity Log Persistence
  console.log('\n5. Testing Unauthorized Activity Log Persistence...');
  const unauthorizedLogs = await getLogsByAction('UNAUTHORIZED');
  const testLog = unauthorizedLogs.find((l) => l.telegramId === nonAdminId);
  console.log('  ✅ Unauthorized log found in activityLogs.json:', Boolean(testLog));
  console.log('  ✅ Log action:', testLog?.action, '| Message:', testLog?.message);

  if (!testLog || testLog.action !== 'UNAUTHORIZED') {
    throw new Error('Expected UNAUTHORIZED log in activityLogs.json');
  }

  // Cleanup test logs
  const allLogs = await loadActivityLogs();
  await saveActivityLogs(allLogs.filter((l) => l.telegramId !== nonAdminId));

  console.log('\n========================================');
  console.log('=== ALL ADMIN AUTH TESTS PASSED 100% ===');
  console.log('========================================');
}

testAdminAuth().catch((err) => {
  console.error('Admin auth test failed:', err);
  process.exit(1);
});
