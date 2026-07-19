import {
  renderAdminSettingsMainText,
  renderAdminSettingsSystemText,
  renderAdminSettingsDatabaseText,
  renderAdminSettingsSecurityText,
  renderAdminSettingsAboutText,
  getAdminSettingsMainKeyboard,
  getAdminSettingsSubPageKeyboard,
} from '../src/commands/adminSettings';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';

async function testAdminSettings() {
  console.log('=== ADMIN SETTINGS CENTER MODULE TEST SUITE ===\n');

  const adminId = 999555666;
  const nonAdminId = 111333999;
  addAdminId(adminId);

  // 1. Test Main Settings Center Rendering
  console.log('1. Testing renderAdminSettingsMainText()...');
  const mainText = await renderAdminSettingsMainText();
  console.log('  ✅ Rendered Main Settings Center Output:\n');
  console.log(mainText);

  if (!mainText.includes('⚙ <b>Administration Settings Center</b>')) {
    throw new Error('Missing Settings Center header');
  }
  if (!mainText.includes('<b>Bot Information</b>')) throw new Error('Missing Bot Info section');
  if (!mainText.includes('<b>Database Center</b>')) throw new Error('Missing Database section');
  if (!mainText.includes('<b>System Modules</b>')) throw new Error('Missing System Modules section');
  if (!mainText.includes('<b>Security Center</b>')) throw new Error('Missing Security section');
  if (!mainText.includes('<b>Project Metadata</b>')) throw new Error('Missing Metadata section');

  // 2. Test Main Settings Inline Keyboard
  console.log('\n2. Testing Main Settings Inline Keyboard...');
  const mainKeyboard: any = getAdminSettingsMainKeyboard();
  const mainRows = mainKeyboard.reply_markup.inline_keyboard;

  console.log('  ✅ Row 1:', mainRows[0].map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Row 2:', mainRows[1].map((b: any) => `${b.text} -> ${b.callback_data}`));
  console.log('  ✅ Row 3:', mainRows[2].map((b: any) => `${b.text} -> ${b.callback_data}`));

  if (mainRows[0][0].callback_data !== 'admin_settings_system') throw new Error('Expected admin_settings_system');
  if (mainRows[0][1].callback_data !== 'admin_settings_database') throw new Error('Expected admin_settings_database');
  if (mainRows[1][0].callback_data !== 'admin_settings_security') throw new Error('Expected admin_settings_security');
  if (mainRows[1][1].callback_data !== 'admin_settings_about') throw new Error('Expected admin_settings_about');
  if (mainRows[2][0].callback_data !== 'admin_dashboard') throw new Error('Expected admin_dashboard');

  // 3. Test System Information Sub-Page
  console.log('\n3. Testing System Information Sub-Page...');
  const systemText = renderAdminSettingsSystemText();
  console.log('  ✅ System Info snippet:', systemText.slice(0, 150).replace(/\n/g, ' '));
  if (!systemText.includes('<b>System Information</b>')) throw new Error('Missing System Info header');

  // 4. Test Database Information Sub-Page
  console.log('\n4. Testing Database Information Sub-Page...');
  const dbText = await renderAdminSettingsDatabaseText();
  console.log('  ✅ Database Info snippet:', dbText.slice(0, 150).replace(/\n/g, ' '));
  if (!dbText.includes('<b>Database Information</b>')) throw new Error('Missing Database Info header');

  // 5. Test Security Information Sub-Page
  console.log('\n5. Testing Security Information Sub-Page...');
  const secText = renderAdminSettingsSecurityText();
  console.log('  ✅ Security Info snippet:', secText.slice(0, 150).replace(/\n/g, ' '));
  if (!secText.includes('<b>Security Information</b>')) throw new Error('Missing Security Info header');

  // 6. Test About Project Sub-Page
  console.log('\n6. Testing About Project Sub-Page...');
  const aboutText = renderAdminSettingsAboutText();
  console.log('  ✅ About Project snippet:', aboutText.slice(0, 150).replace(/\n/g, ' '));
  if (!aboutText.includes('<b>About Project</b>')) throw new Error('Missing About Project header');

  // 7. Test Sub-Page Keyboard Navigation
  console.log('\n7. Testing Sub-Page Navigation Keyboard...');
  const subKeyboard: any = getAdminSettingsSubPageKeyboard();
  const subRows = subKeyboard.reply_markup.inline_keyboard;
  console.log('  ✅ Sub-page Row 1:', subRows[0].map((b: any) => `${b.text} -> ${b.callback_data}`));

  if (subRows[0][0].callback_data !== 'admin_settings') throw new Error('Expected Back to Settings button');
  if (subRows[0][1].callback_data !== 'admin_dashboard') throw new Error('Expected Dashboard button');

  // 8. Test Non-Admin Access Protection
  console.log('\n8. Testing Non-Admin Protection on Settings Center...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: 'admin_settings' },
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

  console.log('\n==========================================================');
  console.log('=== ALL ADMIN SETTINGS CENTER TESTS PASSED 100% ===');
  console.log('==========================================================');
}

testAdminSettings().catch((err) => {
  console.error('Admin settings test failed:', err);
  process.exit(1);
});
