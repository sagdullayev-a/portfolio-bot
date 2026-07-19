import {
  renderAdminStatisticsText,
  getAdminStatisticsKeyboard,
} from '../src/commands/adminStatistics';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, logStart, logCommand, logText, logAI, loadUsers, saveUsers, loadActivityLogs, saveActivityLogs } from '../src/database';

async function testAdminStatistics() {
  console.log('=== ADMIN STATISTICS PAGE MODULE TEST SUITE ===\n');

  const adminId = 999444555;
  const nonAdminId = 111222888;
  const testTgId = 777333444;
  addAdminId(adminId);

  // Clean up old test data
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId));

  // 1. Seed Test Data
  console.log('1. Seeding test user & activity logs...');
  await syncUser({
    telegramId: testTgId,
    chatId: testTgId,
    username: 'stats_page_user',
    firstName: 'StatsPage',
    lastName: 'Tester',
    languageCode: 'uz',
    isPremium: true,
  });

  await logStart({ telegramId: testTgId, message: '/start' });
  await logCommand({ telegramId: testTgId, message: '/aboutme' });
  await logAI({ telegramId: testTgId, message: 'AI question' });
  await logText({ telegramId: testTgId, message: 'Sample text' });

  // 2. Test Admin Statistics Page Rendering
  console.log('\n2. Testing renderAdminStatisticsText()...');
  const statsText = await renderAdminStatisticsText();
  console.log('  ✅ Rendered Statistics Page Output:\n');
  console.log(statsText);

  if (!statsText.includes('📈 <b>Bot Statistics</b>')) throw new Error('Missing Bot Statistics header');
  if (!statsText.includes('<b>System Overview</b>')) throw new Error('Missing System Overview section');
  if (!statsText.includes('<b>Activity Overview</b>')) throw new Error('Missing Activity Overview section');
  if (!statsText.includes('<b>Action Breakdown</b>')) throw new Error('Missing Action Breakdown section');
  if (!statsText.includes('<b>Language Distribution</b>')) throw new Error('Missing Language Distribution section');
  if (!statsText.includes('<b>System Health</b>')) throw new Error('Missing System Health section');
  if (!statsText.includes('<b>Database Info</b>')) throw new Error('Missing Database Info section');

  // Verify Action Breakdown Emojis
  if (!statsText.includes('🚀 <b>START:</b>')) throw new Error('Missing START action breakdown');
  if (!statsText.includes('🤖 <b>AI_CHAT:</b>')) throw new Error('Missing AI_CHAT action breakdown');
  if (!statsText.includes('⛔ <b>UNAUTHORIZED:</b>')) throw new Error('Missing UNAUTHORIZED action breakdown');

  // Verify Language Distribution
  if (!statsText.includes('🇺🇿 <b>Uzbek:</b>')) throw new Error('Missing Uzbek language breakdown');

  // 3. Test Statistics Inline Keyboard
  console.log('\n3. Testing Admin Statistics Inline Keyboard...');
  const keyboardMarkup: any = getAdminStatisticsKeyboard();
  const rows = keyboardMarkup.reply_markup.inline_keyboard;

  console.log('  ✅ Keyboard Rows Count:', rows.length);
  console.log('  ✅ Row 1 buttons:', rows[0].map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Row 2 buttons:', rows[1].map((b: any) => `${b.text} -> ${b.callback_data}`));

  if (rows[0][0].callback_data !== 'admin_statistics_refresh') {
    throw new Error('Expected admin_statistics_refresh callback for Refresh button');
  }
  if (rows[0][1].callback_data !== 'admin_logs') {
    throw new Error('Expected admin_logs callback for Logs button');
  }
  if (rows[1][0].callback_data !== 'admin_users') {
    throw new Error('Expected admin_users callback for Users button');
  }
  if (rows[1][1].callback_data !== 'admin_dashboard') {
    throw new Error('Expected admin_dashboard callback for Dashboard button');
  }

  // 4. Test Non-Admin Access Protection
  console.log('\n4. Testing Non-Admin Access Protection on Statistics Page...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: 'admin_stats' },
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

  // Clean up seeded test data
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId !== testTgId));

  const finalLogs = await loadActivityLogs();
  await saveActivityLogs(finalLogs.filter((l) => l.telegramId !== testTgId));

  console.log('\n========================================================');
  console.log('=== ALL ADMIN STATISTICS PAGE TESTS PASSED 100% ===');
  console.log('========================================================');
}

testAdminStatistics().catch((err) => {
  console.error('Admin statistics test failed:', err);
  process.exit(1);
});
