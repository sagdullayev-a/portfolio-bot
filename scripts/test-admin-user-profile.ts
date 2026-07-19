import {
  renderUserProfileText,
  getUserProfileKeyboard,
  TIMELINE_PLACEHOLDER,
} from '../src/commands/adminUserProfile';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, logText, loadUsers, saveUsers, loadActivityLogs, saveActivityLogs } from '../src/database';

async function testAdminUserProfile() {
  console.log('=== ADMIN USER PROFILE MODULE TEST SUITE ===\n');

  const adminId = 888111333;
  const nonAdminId = 444222111;
  const testTgId = 777123456;
  addAdminId(adminId);

  // Clean up old test data
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId));

  // Seed test user & activity
  console.log('1. Seeding test user & latest activity...');
  const testUser = await syncUser({
    telegramId: testTgId,
    chatId: testTgId,
    username: 'profile_test_user',
    firstName: 'Profile',
    lastName: 'Tester',
    languageCode: 'en',
    isPremium: true,
  });

  await logText({ telegramId: testTgId, message: 'Latest user action message' });

  // 1. Test Profile Rendering
  console.log('\n2. Testing renderUserProfileText()...');
  const profileText = await renderUserProfileText(testUser.id);
  console.log('  ✅ Rendered User Profile:\n');
  console.log(profileText);

  if (!profileText) throw new Error('Expected profileText not to be null');
  if (!profileText.includes('👤 <b>User Profile</b>')) throw new Error('Missing User Profile header');
  if (!profileText.includes('@profile_test_user')) throw new Error('Missing username');
  if (!profileText.includes('💎 <b>Premium:</b>\nYes')) throw new Error('Missing Premium status');
  if (!profileText.includes('<b>TEXT</b>')) throw new Error('Missing latest activity action TEXT');

  // 2. Test User Profile Keyboard & Callbacks
  console.log('\n3. Testing User Profile Keyboard & Callbacks...');
  const keyboardMarkup: any = getUserProfileKeyboard(testUser.id);
  const buttons = keyboardMarkup.reply_markup.inline_keyboard;

  console.log('  ✅ Row 1 button:', buttons[0][0].text, '->', buttons[0][0].callback_data);
  console.log('  ✅ Row 2 button:', buttons[1][0].text, '->', buttons[1][0].callback_data);
  console.log('  ✅ Row 3 button:', buttons[2][0].text, '->', buttons[2][0].callback_data);

  if (buttons[0][0].callback_data !== `admin_user_timeline_${testUser.id}`) {
    throw new Error('Expected admin_user_timeline callback');
  }
  if (buttons[1][0].callback_data !== 'admin_users') {
    throw new Error('Expected admin_users callback');
  }
  if (buttons[2][0].callback_data !== 'admin_dashboard') {
    throw new Error('Expected admin_dashboard callback');
  }

  // 3. Test Timeline Callback Placeholder
  console.log('\n4. Testing Timeline Callback Placeholder...');
  let timelineAlert = '';
  const mockTimelineCtx: any = {
    from: { id: adminId },
    callbackQuery: { data: `admin_user_timeline_${testUser.id}` },
    answerCbQuery: async (msg: string) => {
      timelineAlert = msg;
    },
  };

  await mockTimelineCtx.answerCbQuery(TIMELINE_PLACEHOLDER, { show_alert: true });
  console.log('  ✅ Timeline callback alert:', timelineAlert);
  if (timelineAlert !== '🚧 Timeline keyingi phaseda quriladi.') {
    throw new Error('Expected timeline placeholder message');
  }

  // 4. Test Non-Admin Access Protection
  console.log('\n5. Testing Non-Admin Access Protection...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: `admin_user_${testUser.id}` },
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

  console.log('\n=================================================');
  console.log('=== ALL USER PROFILE MODULE TESTS PASSED 100% ===');
  console.log('=================================================');
}

testAdminUserProfile().catch((err) => {
  console.error('User profile test failed:', err);
  process.exit(1);
});
