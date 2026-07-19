import {
  syncUser,
  findUserByTelegramId,
  incrementMessageCount,
  incrementCommandCount,
  incrementAIRequestCount,
  updateLastActive,
  updateLastCommand,
  updateLastFunction,
  saveUser,
} from '../src/database';

async function testUserService() {
  console.log('=== USER TRACKING SERVICE TEST SUITE ===\n');

  const testTelegramId = 999888777;

  // Clean up test user if exists
  const existing = await findUserByTelegramId(testTelegramId);
  if (existing) {
    const { loadUsers, saveUsers } = await import('../src/database/database');
    const users = await loadUsers();
    await saveUsers(users.filter((u) => u.telegramId !== testTelegramId));
  }

  // 1. Test syncUser for NEW user (createUser)
  console.log('1. Testing syncUser (New User Creation)...');
  const newUser = await syncUser({
    telegramId: testTelegramId,
    chatId: testTelegramId,
    username: 'test_sync_user',
    firstName: 'Azizxon',
    lastName: 'Sagdullayev',
    languageCode: 'uz',
    isPremium: true,
    isBot: false,
    addedToAttachmentMenu: false,
    chatType: 'private',
  });

  console.log('  ✅ Created user ID:', newUser.id);
  console.log('  ✅ messageCount:', newUser.messageCount); // Should be 1
  console.log('  ✅ username:', newUser.username);

  if (newUser.messageCount !== 1) throw new Error('Expected messageCount to be 1 for new user');
  if (newUser.username !== 'test_sync_user') throw new Error('Expected username to match');

  // 2. Test syncUser for EXISTING user (updateUser)
  console.log('\n2. Testing syncUser (Existing User Update)...');
  const updatedUser = await syncUser({
    telegramId: testTelegramId,
    chatId: testTelegramId,
    username: 'updated_user_name',
    firstName: 'Azizxon (Updated)',
    lastName: 'Sagdullayev',
    languageCode: 'en',
    isPremium: false,
    isBot: false,
    addedToAttachmentMenu: false,
    chatType: 'private',
  });

  console.log('  ✅ Updated messageCount:', updatedUser.messageCount); // Should be 2
  console.log('  ✅ Updated username:', updatedUser.username);
  console.log('  ✅ Updated firstName:', updatedUser.firstName);

  if (updatedUser.messageCount !== 2) throw new Error('Expected messageCount to be 2 after syncUser update');
  if (updatedUser.username !== 'updated_user_name') throw new Error('Expected updated username');

  // 3. Test findUserByTelegramId
  console.log('\n3. Testing findUserByTelegramId...');
  const found = await findUserByTelegramId(testTelegramId);
  console.log('  ✅ Found user telegramId:', found?.telegramId);
  if (!found) throw new Error('User should be found');

  // 4. Test helper increments
  console.log('\n4. Testing Helper Increments...');
  await incrementCommandCount(testTelegramId);
  await incrementAIRequestCount(testTelegramId);
  await updateLastCommand(testTelegramId, '/start');
  await updateLastFunction(testTelegramId, 'startCommand');

  const afterHelpers = await findUserByTelegramId(testTelegramId);
  console.log('  ✅ commandCount:', afterHelpers?.commandCount); // Should be 1
  console.log('  ✅ aiRequestCount:', afterHelpers?.aiRequestCount); // Should be 1
  console.log('  ✅ lastCommand:', afterHelpers?.lastCommand); // Should be '/start'
  console.log('  ✅ lastFunction:', afterHelpers?.lastFunction); // Should be 'startCommand'

  if (afterHelpers?.commandCount !== 1) throw new Error('Expected commandCount 1');
  if (afterHelpers?.aiRequestCount !== 1) throw new Error('Expected aiRequestCount 1');
  if (afterHelpers?.lastCommand !== '/start') throw new Error('Expected lastCommand /start');

  // Clean up test user
  const { loadUsers, saveUsers } = await import('../src/database/database');
  const users = await loadUsers();
  await saveUsers(users.filter((u) => u.telegramId !== testTelegramId));

  console.log('\n========================================');
  console.log('=== ALL USER SERVICE TESTS PASSED 100% ===');
  console.log('========================================');
}

testUserService().catch((err) => {
  console.error('User service test failed:', err);
  process.exit(1);
});
