import {
  getAllUsers,
  getUserById,
  getUserByTelegramId,
  getUserByUsername,
  getUsersRegisteredToday,
  getUsersRegisteredThisWeek,
  getUsersRegisteredThisMonth,
  getActiveUsersToday,
  getTopActiveUsers,
  getPremiumUsers,
  searchUsers,
  getAllLogs,
  getRecentLogs,
  getLogsByUser,
  getLogsByTelegramId,
  getLogsByAction,
  getLogsToday,
  getLogsBetweenDates,
  getLatestUserActivity,
  syncUser,
  logText,
  logCommand,
  loadUsers,
  saveUsers,
  loadActivityLogs,
  saveActivityLogs,
} from '../src/database';

async function testQueryService() {
  console.log('=== QUERY SERVICE TEST SUITE ===\n');

  const testTgId1 = 111222333;
  const testTgId2 = 444555666;

  // Clean up any existing test records
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId1 && u.telegramId !== testTgId2));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId1 && l.telegramId !== testTgId2));

  // Seed test users
  console.log('1. Seeding test users & activity logs...');
  const user1 = await syncUser({
    telegramId: testTgId1,
    chatId: testTgId1,
    username: 'query_user_one',
    firstName: 'Aziz',
    lastName: 'Sagdullayev',
    languageCode: 'uz',
    isPremium: true,
  });

  const user2 = await syncUser({
    telegramId: testTgId2,
    chatId: testTgId2,
    username: 'query_user_two',
    firstName: 'Bohodir',
    lastName: 'Karimov',
    languageCode: 'en',
    isPremium: false,
  });

  // Seed test logs
  const log1 = await logText({ telegramId: testTgId1, message: 'Hello query engine' });
  const log2 = await logCommand({ telegramId: testTgId1, message: '/start' });
  await logText({ telegramId: testTgId2, message: 'Second user message' });

  // ── USER QUERIES ─────────────────────────────────────────────────────────
  console.log('\n2. Testing User Queries...');
  
  const allUsers = await getAllUsers();
  console.log('  ✅ getAllUsers count:', allUsers.length);
  if (allUsers.length < 2) throw new Error('Expected at least 2 users');

  const foundById = await getUserById(user1.id);
  console.log('  ✅ getUserById username:', foundById?.username);
  if (foundById?.id !== user1.id) throw new Error('Expected user1 by ID');

  const foundByTgId = await getUserByTelegramId(testTgId1);
  console.log('  ✅ getUserByTelegramId:', foundByTgId?.telegramId);
  if (foundByTgId?.telegramId !== testTgId1) throw new Error('Expected testTgId1');

  const foundByUsername = await getUserByUsername('@query_user_one');
  console.log('  ✅ getUserByUsername (@query_user_one):', foundByUsername?.username);
  if (foundByUsername?.id !== user1.id) throw new Error('Expected user1 by username');

  const regToday = await getUsersRegisteredToday();
  console.log('  ✅ getUsersRegisteredToday count:', regToday.length);
  if (regToday.length < 2) throw new Error('Expected users registered today');

  const regWeek = await getUsersRegisteredThisWeek();
  console.log('  ✅ getUsersRegisteredThisWeek count:', regWeek.length);

  const regMonth = await getUsersRegisteredThisMonth();
  console.log('  ✅ getUsersRegisteredThisMonth count:', regMonth.length);

  const activeToday = await getActiveUsersToday();
  console.log('  ✅ getActiveUsersToday count:', activeToday.length);

  const topActive = await getTopActiveUsers(5);
  console.log('  ✅ getTopActiveUsers top messageCount:', topActive[0]?.messageCount);

  const premiumUsers = await getPremiumUsers();
  console.log('  ✅ getPremiumUsers count:', premiumUsers.length);
  if (!premiumUsers.some((u) => u.id === user1.id)) throw new Error('Expected user1 in premium users');

  // ── SEARCH QUERIES ───────────────────────────────────────────────────────
  console.log('\n3. Testing Search Queries...');
  const searchResult = await searchUsers('Aziz');
  console.log('  ✅ searchUsers("Aziz") result count:', searchResult.length);
  if (searchResult[0]?.firstName !== 'Aziz') throw new Error('Expected Aziz in search result');

  const searchTgId = await searchUsers(String(testTgId2));
  console.log('  ✅ searchUsers(telegramId) result count:', searchTgId.length);
  if (searchTgId[0]?.telegramId !== testTgId2) throw new Error('Expected user2 in search result');

  // ── ACTIVITY QUERIES ─────────────────────────────────────────────────────
  console.log('\n4. Testing Activity Queries...');
  const allLogs = await getAllLogs();
  console.log('  ✅ getAllLogs count:', allLogs.length);

  const recentLogs = await getRecentLogs(2);
  console.log('  ✅ getRecentLogs(2) count:', recentLogs.length);
  if (recentLogs.length !== 2) throw new Error('Expected exactly 2 recent logs');

  const userLogs = await getLogsByUser(user1.id);
  console.log('  ✅ getLogsByUser(user1.id) count:', userLogs.length);

  const tgLogs = await getLogsByTelegramId(testTgId1);
  console.log('  ✅ getLogsByTelegramId(testTgId1) count:', tgLogs.length);
  if (tgLogs.length < 2) throw new Error('Expected at least 2 logs for testTgId1');

  const cmdLogs = await getLogsByAction('COMMAND');
  console.log('  ✅ getLogsByAction("COMMAND") count:', cmdLogs.length);

  const logsToday = await getLogsToday();
  console.log('  ✅ getLogsToday count:', logsToday.length);

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const rangeLogs = await getLogsBetweenDates(yesterday, tomorrow);
  console.log('  ✅ getLogsBetweenDates count:', rangeLogs.length);

  const latestAct = await getLatestUserActivity(user1.id);
  console.log('  ✅ getLatestUserActivity action:', latestAct?.action);
  if (!latestAct) throw new Error('Expected latest user activity');

  // Cleanup test data
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId !== testTgId1 && u.telegramId !== testTgId2));

  const finalLogs = await loadActivityLogs();
  await saveActivityLogs(finalLogs.filter((l) => l.telegramId !== testTgId1 && l.telegramId !== testTgId2));

  console.log('\n========================================');
  console.log('=== ALL QUERY SERVICE TESTS PASSED 100% ===');
  console.log('========================================');
}

testQueryService().catch((err) => {
  console.error('Query service test failed:', err);
  process.exit(1);
});
