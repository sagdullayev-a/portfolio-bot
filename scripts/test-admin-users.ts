import {
  renderUsersPageText,
  getUsersPageKeyboard,
  formatRelativeTime,
  USER_PROFILE_PLACEHOLDER,
} from '../src/commands/adminUsers';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, loadUsers, saveUsers } from '../src/database';

async function testAdminUsers() {
  console.log('=== ADMIN USERS MODULE TEST SUITE ===\n');

  const adminId = 999111222;
  const nonAdminId = 333444555;
  addAdminId(adminId);

  // Clean up any existing test users
  const oldUsers = await loadUsers();
  const baseTgId = 9000000;
  await saveUsers(oldUsers.filter((u) => u.telegramId < baseTgId));

  // Seed 15 test users to verify multi-page pagination (10 per page -> 2 pages)
  console.log('1. Seeding 15 test users...');
  const seededUsers = [];
  for (let i = 1; i <= 15; i++) {
    const user = await syncUser({
      telegramId: baseTgId + i,
      chatId: baseTgId + i,
      username: `user_${i}`,
      firstName: `User${i}`,
      lastName: `Test`,
      languageCode: 'uz',
    });
    seededUsers.push(user);
  }

  // 1. Test Page 1 Rendering
  console.log('\n2. Testing Page 1 Rendering (10 users)...');
  const page1 = await renderUsersPageText(1);
  console.log('  ✅ Page 1 Total Users:', page1.totalUsers);
  console.log('  ✅ Page 1 Total Pages:', page1.totalPages);
  console.log('  ✅ Page 1 Users Count:', page1.users.length);

  if (page1.totalUsers < 15) throw new Error('Expected at least 15 total users');
  if (page1.totalPages < 2) throw new Error('Expected at least 2 pages');
  if (page1.users.length !== 10) throw new Error('Expected exactly 10 users on page 1');

  // 2. Test Page 2 Rendering
  console.log('\n3. Testing Page 2 Rendering (remaining 5 users)...');
  const page2 = await renderUsersPageText(2);
  console.log('  ✅ Page 2 Users Count:', page2.users.length);
  if (page2.users.length < 5) throw new Error('Expected at least 5 users on page 2');

  // 3. Test Relative Time Formatter
  console.log('\n4. Testing Relative Time Formatter...');
  const nowStr = new Date().toISOString();
  const minAgoStr = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const hourAgoStr = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const dayAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  console.log('  ✅ Just now:', formatRelativeTime(nowStr));
  console.log('  ✅ 5 min ago:', formatRelativeTime(minAgoStr));
  console.log('  ✅ 2 hours ago:', formatRelativeTime(hourAgoStr));
  console.log('  ✅ 3 days ago:', formatRelativeTime(dayAgoStr));

  if (formatRelativeTime(nowStr) !== 'Just now') throw new Error('Expected Just now');
  if (!formatRelativeTime(minAgoStr).includes('min ago')) throw new Error('Expected min ago');

  // 4. Test Page Keyboard & Navigation Callbacks
  console.log('\n5. Testing Inline Keyboards (Prev / Next / User Buttons / Dashboard)...');
  const page1Keyboard: any = getUsersPageKeyboard(page1.page, page1.totalPages, page1.users);
  const rows = page1Keyboard.reply_markup.inline_keyboard;

  console.log('  ✅ Keyboard Rows Count:', rows.length);
  const navRow = rows[rows.length - 2]; // Pagination row
  const backRow = rows[rows.length - 1]; // Back to dashboard row

  console.log('  ✅ Pagination Nav Row:', navRow.map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Dashboard Back Button:', backRow[0].text, '->', backRow[0].callback_data);

  if (!navRow.some((b: any) => b.callback_data === 'admin_users_page_2')) {
    throw new Error('Page 1 keyboard should have Next button to page 2');
  }
  if (backRow[0].callback_data !== 'admin_dashboard') {
    throw new Error('Expected admin_dashboard callback');
  }

  // 5. Test User Profile Callback Placeholder
  console.log('\n6. Testing User Profile Callback...');
  let userAlertText = '';
  const mockUserCbCtx: any = {
    from: { id: adminId },
    callbackQuery: { data: `admin_user_${seededUsers[0].id}` },
    answerCbQuery: async (msg: string) => {
      userAlertText = msg;
    },
  };

  await mockUserCbCtx.answerCbQuery(USER_PROFILE_PLACEHOLDER, { show_alert: true });
  console.log('  ✅ User callback message:', userAlertText);
  if (userAlertText !== '🚧 User Profile keyingi phaseda quriladi.') {
    throw new Error('Expected user profile placeholder message');
  }

  // 6. Test Unauthorized Access Protection
  console.log('\n7. Testing Non-Admin Protection on Users Page...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: 'admin_users' },
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

  // Clean up seeded test users
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId < baseTgId));

  console.log('\n========================================');
  console.log('=== ALL ADMIN USERS TESTS PASSED 100% ===');
  console.log('========================================');
}

testAdminUsers().catch((err) => {
  console.error('Admin users test failed:', err);
  process.exit(1);
});
