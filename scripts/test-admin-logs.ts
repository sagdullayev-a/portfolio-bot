import {
  renderGlobalLogsText,
  getGlobalLogsKeyboard,
  formatMessagePreview,
  ACTION_ICONS,
} from '../src/commands/adminLogs';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, logStart, logCommand, logText, logAI, loadUsers, saveUsers, loadActivityLogs, saveActivityLogs } from '../src/database';

async function testAdminLogs() {
  console.log('=== ADMIN GLOBAL LOGS VIEWER MODULE TEST SUITE ===\n');

  const adminId = 999333222;
  const nonAdminId = 111444777;
  const testTgId = 888222333;
  addAdminId(adminId);

  // Clean up test data
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId));

  // 1. Seed Test User & 15 Activity Logs to verify multi-page pagination
  console.log('1. Seeding test user & 15 activity logs...');
  const testUser = await syncUser({
    telegramId: testTgId,
    chatId: testTgId,
    username: 'logs_viewer_user',
    firstName: 'LogsViewer',
    lastName: 'Tester',
  });

  await logStart({ telegramId: testTgId, message: '/start' });
  await logCommand({ telegramId: testTgId, message: '/aboutme' });
  await logAI({ telegramId: testTgId, message: 'AI question test' });
  for (let i = 1; i <= 12; i++) {
    await logText({ telegramId: testTgId, message: `Log message ${i}` });
  }

  // 2. Test Message Preview Formatter
  console.log('\n2. Testing Message Preview Formatter & Action Icons...');
  console.log('  ✅ START icon:', ACTION_ICONS.START);
  console.log('  ✅ COMMAND icon:', ACTION_ICONS.COMMAND);
  console.log('  ✅ TEXT icon:', ACTION_ICONS.TEXT);

  if (ACTION_ICONS.START !== '🚀' || ACTION_ICONS.COMMAND !== '🟢') {
    throw new Error('Action icon mapping mismatch');
  }

  const textPreview = formatMessagePreview('TEXT', 'This is a long text message that should be truncated after fifty characters for clean display.');
  console.log('  ✅ Truncated text preview:', textPreview);
  if (!textPreview.endsWith('...')) throw new Error('Long text should be truncated with ...');

  const photoPreview = formatMessagePreview('PHOTO', 'file_id_123');
  console.log('  ✅ Photo preview:', photoPreview);
  if (photoPreview !== '[Photo]') throw new Error('Expected [Photo] preview');

  // 3. Test Global Logs Page 1 Rendering & Ordering (Newest First)
  console.log('\n3. Testing Global Logs Page 1 Rendering (10 logs)...');
  const page1 = await renderGlobalLogsText(1);
  console.log('  ✅ Page 1 Total Logs:', page1.totalLogs);
  console.log('  ✅ Page 1 Total Pages:', page1.totalPages);
  console.log('  ✅ Rendered Logs Output Snippet:\n');
  console.log(page1.text.slice(0, 350) + '...\n');

  if (page1.totalLogs < 15) throw new Error('Expected at least 15 logs');
  if (page1.totalPages < 2) throw new Error('Expected at least 2 pages');

  // 4. Test Global Logs Page 2 Rendering
  console.log('\n4. Testing Global Logs Page 2 Rendering...');
  const page2 = await renderGlobalLogsText(2);
  console.log('  ✅ Page 2 Total Pages:', page2.totalPages);
  if (page2.page !== 2) throw new Error('Expected page 2');

  // 5. Test Inline Keyboard Navigation Callbacks
  console.log('\n5. Testing Inline Keyboards (Previous / Next / Refresh / Dashboard)...');
  const keyboardMarkup: any = getGlobalLogsKeyboard(page1.page, page1.totalPages);
  const rows = keyboardMarkup.reply_markup.inline_keyboard;

  console.log('  ✅ Keyboard Rows Count:', rows.length);
  const navRow = rows[0]; // Pagination row
  const actionRow = rows[1]; // Refresh & Dashboard row

  console.log('  ✅ Pagination Row:', navRow.map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Action Row:', actionRow.map((b: any) => `${b.text} -> ${b.callback_data}`));

  if (!navRow.some((b: any) => b.callback_data === 'admin_logs_page_2')) {
    throw new Error('Page 1 keyboard should have Next button to admin_logs_page_2');
  }
  if (actionRow[0].callback_data !== 'admin_logs_page_1') {
    throw new Error('Refresh button should call current page callback');
  }
  if (actionRow[1].callback_data !== 'admin_dashboard') {
    throw new Error('Expected admin_dashboard callback');
  }

  // 6. Test Non-Admin Access Protection
  console.log('\n6. Testing Non-Admin Access Protection on Logs Viewer...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: 'admin_logs' },
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

  console.log('\n======================================================');
  console.log('=== ALL GLOBAL LOGS VIEWER TESTS PASSED 100% ===');
  console.log('======================================================');
}

testAdminLogs().catch((err) => {
  console.error('Admin logs test failed:', err);
  process.exit(1);
});
