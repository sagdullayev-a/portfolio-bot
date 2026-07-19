import {
  performGlobalSearch,
  renderSearchResultText,
  getSearchResultKeyboard,
  SEARCH_PROMPT_TEXT,
  NOT_FOUND_TEXT,
  startSearchSession,
  clearSearchSession,
  hasActiveSearchSession,
} from '../src/commands/adminSearch';
import { addAdminId } from '../src/config/admin';
import { adminAuthMiddleware, UNAUTHORIZED_MESSAGE } from '../src/middlewares/adminAuth';
import { syncUser, loadUsers, saveUsers } from '../src/database';

async function testAdminSearch() {
  console.log('=== ADMIN GLOBAL SEARCH MODULE TEST SUITE ===\n');

  const adminId = 999000111;
  const nonAdminId = 222333444;
  const testTgId = 777888999;
  addAdminId(adminId);

  // Clean up old test data
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId));

  // Seed test user
  console.log('1. Seeding test user for global search...');
  const testUser = await syncUser({
    telegramId: testTgId,
    chatId: testTgId,
    username: 'search_target_user',
    firstName: 'SearchName',
    lastName: 'Tester',
    languageCode: 'uz',
  });

  // 1. Test Search Session State
  console.log('\n2. Testing Search Session State (start/has/clear)...');
  startSearchSession(adminId);
  console.log('  ✅ session active after start:', hasActiveSearchSession(adminId));
  if (!hasActiveSearchSession(adminId)) throw new Error('Expected session to be active');

  clearSearchSession(adminId);
  console.log('  ✅ session active after clear:', hasActiveSearchSession(adminId));
  if (hasActiveSearchSession(adminId)) throw new Error('Expected session to be cleared');

  // 2. Test Search by Name
  console.log('\n3. Testing Search by Name ("SearchName")...');
  const nameResults = await performGlobalSearch('SearchName');
  console.log('  ✅ Search by name count:', nameResults.length);
  if (nameResults.length !== 1 || nameResults[0].id !== testUser.id) {
    throw new Error('Search by name failed');
  }

  // 3. Test Search by Username
  console.log('\n4. Testing Search by Username ("@search_target_user")...');
  const usernameResults = await performGlobalSearch('@search_target_user');
  console.log('  ✅ Search by username count:', usernameResults.length);
  if (usernameResults.length !== 1 || usernameResults[0].id !== testUser.id) {
    throw new Error('Search by username failed');
  }

  // 4. Test Search by Telegram ID
  console.log('\n5. Testing Search by Telegram ID ("777888999")...');
  const tgIdResults = await performGlobalSearch('777888999');
  console.log('  ✅ Search by Telegram ID count:', tgIdResults.length);
  if (tgIdResults.length !== 1 || tgIdResults[0].id !== testUser.id) {
    throw new Error('Search by Telegram ID failed');
  }

  // 5. Test Search by User ID (UUID)
  console.log('\n6. Testing Search by User ID (UUID)...');
  const uuidResults = await performGlobalSearch(testUser.id);
  console.log('  ✅ Search by User ID count:', uuidResults.length);
  if (uuidResults.length !== 1 || uuidResults[0].id !== testUser.id) {
    throw new Error('Search by User ID failed');
  }

  // 6. Test Not Found Handling
  console.log('\n7. Testing Search Not Found ("nonexistent_user_999")...');
  const notFoundResults = await performGlobalSearch('nonexistent_user_999');
  const notFoundText = renderSearchResultText(notFoundResults);
  console.log('  ✅ Not found result count:', notFoundResults.length);
  console.log('  ✅ Not found text output:', notFoundText);

  if (notFoundResults.length !== 0) throw new Error('Expected 0 results for non-existent search');
  if (notFoundText !== NOT_FOUND_TEXT) throw new Error('Expected NOT_FOUND_TEXT string');

  // 7. Test Result Rendering & Open Profile Keyboard
  console.log('\n8. Testing Search Result Keyboard (Open Profile & Dashboard)...');
  const resultText = renderSearchResultText(nameResults);
  const keyboardMarkup: any = getSearchResultKeyboard(nameResults);
  const rows = keyboardMarkup.reply_markup.inline_keyboard;

  console.log('  ✅ Rendered Search Result Snippet:\n', resultText.slice(0, 200));
  console.log('  ✅ Row 1 button:', rows[0][0].text, '->', rows[0][0].callback_data);
  console.log('  ✅ Row 2 button:', rows[1][0].text, '->', rows[1][0].callback_data);

  if (rows[0][0].callback_data !== `admin_user_${testUser.id}`) {
    throw new Error('Expected admin_user callback for Open Profile button');
  }
  if (rows[1][0].callback_data !== 'admin_dashboard') {
    throw new Error('Expected admin_dashboard callback');
  }

  // 8. Test Non-Admin Access Protection
  console.log('\n9. Testing Non-Admin Access Protection on Search...');
  let nonAdminBlocked = false;
  let rejectionMessage = '';

  const mockNonAdminCtx: any = {
    from: { id: nonAdminId },
    callbackQuery: { data: 'admin_search' },
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

  // Clean up seeded test user
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId !== testTgId));

  console.log('\n===================================================');
  console.log('=== ALL GLOBAL SEARCH MODULE TESTS PASSED 100% ===');
  console.log('===================================================');
}

testAdminSearch().catch((err) => {
  console.error('Admin search test failed:', err);
  process.exit(1);
});
