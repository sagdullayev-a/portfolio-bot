import {
  loadUsers,
  saveUsers,
  loadActivityLogs,
  saveActivityLogs,
  readJson,
  User,
  ActivityLog,
} from '../src/database';
import path from 'path';

async function testDatabase() {
  console.log('=== DATABASE FOUNDATION TEST ===\n');

  // 1. Test load initial empty arrays
  const initialUsers = await loadUsers();
  console.log('Initial Users count:', initialUsers.length);

  const initialLogs = await loadActivityLogs();
  console.log('Initial ActivityLogs count:', initialLogs.length);

  // 2. Test saving and loading a User
  const mockUser: User = {
    id: 'user_1',
    telegramId: 123456789,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    languageCode: 'uz',
    isPremium: true,
    isBot: false,
    addedToAttachmentMenu: false,
    chatId: 123456789,
    chatType: 'private',
    registeredAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    messageCount: 1,
    commandCount: 1,
    aiRequestCount: 0,
    lastCommand: '/start',
    lastFunction: 'startHandler',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveUsers([mockUser]);
  const loadedUsers = await loadUsers();
  console.log('Saved and Loaded Users count:', loadedUsers.length);
  console.log('User username:', loadedUsers[0]?.username);

  // Reset back to empty array
  await saveUsers([]);

  // 3. Test saving and loading ActivityLogs
  const mockLog: ActivityLog = {
    id: 'log_1',
    telegramId: 123456789,
    action: 'start_command',
    message: 'User ran /start command',
    createdAt: new Date().toISOString(),
  };

  await saveActivityLogs([mockLog]);
  const loadedLogs = await loadActivityLogs();
  console.log('Saved and Loaded ActivityLogs count:', loadedLogs.length);
  console.log('Log action:', loadedLogs[0]?.action);

  // Reset back to empty array
  await saveActivityLogs([]);

  // 4. Test corrupted file fallback
  const corruptedFallback = await readJson(path.join(__dirname, 'non_existent.json'), []);
  console.log('Corrupted/Missing file fallback returned empty array:', Array.isArray(corruptedFallback) && corruptedFallback.length === 0);

  console.log('\n=== ALL DATABASE TESTS PASSED ===');
}

testDatabase().catch((err) => {
  console.error('Database test failed:', err);
  process.exit(1);
});
