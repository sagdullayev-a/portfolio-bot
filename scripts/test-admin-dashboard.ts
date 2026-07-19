import {
  renderAdminDashboardText,
  getAdminDashboardKeyboard,
  ADMIN_PLACEHOLDER_MESSAGE,
} from '../src/commands/adminDashboard';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';

async function testAdminDashboard() {
  console.log('=== ADMIN DASHBOARD TEST SUITE ===\n');

  const adminId = 777666555;
  const nonAdminId = 111222333;
  addAdminId(adminId);

  // 1. Test Dashboard Text Rendering via Statistics Engine
  console.log('1. Testing renderAdminDashboardText()...');
  const dashboardText = await renderAdminDashboardText();
  console.log('  ✅ Rendered Dashboard Output:\n');
  console.log(dashboardText);

  if (!dashboardText.includes('📊 <b>Admin Dashboard</b>')) throw new Error('Missing Dashboard header');
  if (!dashboardText.includes('👥 <b>Users:</b>')) throw new Error('Missing Users section');
  if (!dashboardText.includes('💬 <b>Messages:</b>')) throw new Error('Missing Messages section');

  // 2. Test Inline Keyboard Structure
  console.log('\n2. Testing getAdminDashboardKeyboard()...');
  const keyboardMarkup: any = getAdminDashboardKeyboard();
  const buttons = keyboardMarkup.reply_markup.inline_keyboard;
  console.log('  ✅ Keyboard rows count:', buttons.length);
  console.log('  ✅ Row 1 buttons:', buttons[0].map((b: any) => b.text));
  console.log('  ✅ Row 2 buttons:', buttons[1].map((b: any) => b.text));
  console.log('  ✅ Row 3 buttons:', buttons[2].map((b: any) => b.text));

  if (buttons[0][0].callback_data !== 'admin_users') throw new Error('Expected admin_users callback');
  if (buttons[0][1].callback_data !== 'admin_stats') throw new Error('Expected admin_stats callback');
  if (buttons[1][0].callback_data !== 'admin_timeline') throw new Error('Expected admin_timeline callback');
  if (buttons[1][1].callback_data !== 'admin_search') throw new Error('Expected admin_search callback');
  if (buttons[2][0].callback_data !== 'admin_settings') throw new Error('Expected admin_settings callback');

  // 3. Test Callback Placeholder Message
  console.log('\n3. Testing Callback Placeholder Message...');
  let alertText = '';
  const mockCbCtx: any = {
    from: { id: adminId },
    callbackQuery: { data: 'admin_users' },
    answerCbQuery: async (msg: string) => {
      alertText = msg;
    },
  };

  await adminAuthMiddleware(mockCbCtx, async () => {
    await mockCbCtx.answerCbQuery(ADMIN_PLACEHOLDER_MESSAGE, { show_alert: true });
  });

  console.log('  ✅ Callback response text:', alertText);
  if (alertText !== '🚧 Bu modul keyingi phaseda quriladi.') throw new Error('Expected placeholder message');

  // 4. Test Non-Admin Blocking on Admin Callback / Command
  console.log('\n4. Testing Non-Admin Blocking...');
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

  console.log('\n========================================');
  console.log('=== ALL DASHBOARD TESTS PASSED 100% ===');
  console.log('========================================');
}

testAdminDashboard().catch((err) => {
  console.error('Admin dashboard test failed:', err);
  process.exit(1);
});
