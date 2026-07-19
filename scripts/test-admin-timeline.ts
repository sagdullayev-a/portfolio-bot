import {
  renderUserTimelineText,
  getUserTimelineKeyboard,
} from '../src/commands/adminTimeline';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, logText, logCommand, logStart, loadUsers, saveUsers, loadActivityLogs, saveActivityLogs } from '../src/database';

async function testAdminTimeline() {
  console.log('=== ADMIN TIMELINE MODULE TEST SUITE ===\n');

  const adminId = 999888777;
  const nonAdminId = 111333222;
  const testTgId = 888777666;
  addAdminId(adminId);

  // Clean up old test data
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId));

  // Seed test user & 15 activity logs for pagination testing
  console.log('1. Seeding test user & 15 activity logs...');
  const testUser = await syncUser({
    telegramId: testTgId,
    chatId: testTgId,
    username: 'timeline_user',
    firstName: 'Timeline',
    lastName: 'Tester',
  });

  await logStart({ telegramId: testTgId, message: '/start' });
  for (let i = 1; i <= 14; i++) {
    await logText({ telegramId: testTgId, message: `Timeline message ${i}` });
  }

  // 1. Test Timeline Page 1 Rendering & Sorting (Newest -> Oldest)
  console.log('\n2. Testing Page 1 Timeline Rendering & Sorting...');
  const page1 = await renderUserTimelineText(testUser.id, 1);
  console.log('  ✅ Page 1 Total Logs:', page1.totalLogs);
  console.log('  ✅ Page 1 Total Pages:', page1.totalPages);
  console.log('  ✅ Page 1 Logs Count:', page1.logs.length);
  console.log('  ✅ Page 1 First Log Action:', page1.logs[0].action);
  console.log('  ✅ Rendered Timeline Output Snippet:\n');
  console.log(page1.text.slice(0, 300) + '...\n');

  if (page1.totalLogs < 15) throw new Error('Expected at least 15 logs');
  if (page1.totalPages < 2) throw new Error('Expected at least 2 pages');
  if (page1.logs.length !== 10) throw new Error('Expected 10 logs on page 1');

  // Verify newest log is first
  const firstLogTime = new Date(page1.logs[0].createdAt).getTime();
  const secondLogTime = new Date(page1.logs[1].createdAt).getTime();
  if (firstLogTime < secondLogTime) {
    throw new Error('Logs should be sorted Newest -> Oldest');
  }

  // 2. Test Timeline Page 2 Rendering
  console.log('\n3. Testing Page 2 Timeline Rendering...');
  const page2 = await renderUserTimelineText(testUser.id, 2);
  console.log('  ✅ Page 2 Logs Count:', page2.logs.length);
  if (page2.logs.length < 5) throw new Error('Expected at least 5 logs on page 2');

  // 3. Test Inline Keyboard Navigation Callbacks
  console.log('\n4. Testing Inline Keyboard Callbacks (Prev / Next / Profile / Users / Dashboard)...');
  const keyboardMarkup: any = getUserTimelineKeyboard(testUser.id, page1.page, page1.totalPages);
  const rows = keyboardMarkup.reply_markup.inline_keyboard;

  console.log('  ✅ Keyboard Rows Count:', rows.length);
  const navRow = rows[0]; // Pagination row
  const backRow = rows[1]; // Profile / Users / Dashboard row

  console.log('  ✅ Pagination Nav Row:', navRow.map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Navigation Row:', backRow.map((b: any) => `${b.text} -> ${b.callback_data}`));

  if (!navRow.some((b: any) => b.callback_data === `admin_timeline_page_${testUser.id}_2`)) {
    throw new Error('Expected admin_timeline_page_2 callback');
  }
  if (backRow[0].callback_data !== `admin_user_${testUser.id}`) {
    throw new Error('Expected Profile callback');
  }
  if (backRow[1].callback_data !== 'admin_users') {
    throw new Error('Expected Users callback');
  }
  if (backRow[2].callback_data !== 'admin_dashboard') {
    throw new Error('Expected Dashboard callback');
  }

  // 4. Test Non-Admin Access Protection
  console.log('\n5. Testing Non-Admin Access Protection...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: `admin_user_timeline_${testUser.id}` },
    reply: async (msg: string) => {
      rejectionMessage = msg;
    },
  };

  await adminAuthMiddleware(mockNonAdminCtx, async () => {
    nonAdminBlocked = true;
  });

  console.log('  ✅ Non-admin next() called:', nonAdminBlocked);
  console.log('  ✅ Rejection message:', rejectionMessage);

  if (nonAdminBlocked) throw new Error('Non-admin should be blocked');
  if (rejectionMessage !== UNAUTHORIZED_MESSAGE) throw new Error('Expected unauthorized rejection message');

  // Clean up seeded test user & logs
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId !== testTgId));

  const finalLogs = await loadActivityLogs();
  await saveActivityLogs(finalLogs.filter((l) => l.telegramId !== testTgId));

  console.log('\n====================================================');
  console.log('=== ALL ACTIVITY TIMELINE TESTS PASSED 100% ===');
  console.log('====================================================');
}

testAdminTimeline().catch((err) => {
  console.error('Admin timeline test failed:', err);
  process.exit(1);
});
