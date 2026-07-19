import {
  getOverview,
  getTotalUsers,
  getNewUsersToday,
  getNewUsersThisWeek,
  getNewUsersThisMonth,
  getPremiumUsersCount,
  getTotalMessages,
  getTotalCommands,
  getTotalAIRequests,
  getTotalLogs,
  getActionStatistics,
  getLanguageStatistics,
  getDailyStatistics,
  getActiveUsersTodayCount,
} from '../src/database/statisticsService';
import {
  syncUser,
  logStart,
  logCommand,
  logText,
  logAI,
  loadUsers,
  saveUsers,
  loadActivityLogs,
  saveActivityLogs,
} from '../src/database';

async function testStatisticsService() {
  console.log('=== STATISTICS SERVICE TEST SUITE ===\n');

  const testTgId1 = 555666777;
  const testTgId2 = 888999000;

  // Clean up any existing test records
  const oldUsers = await loadUsers();
  await saveUsers(oldUsers.filter((u) => u.telegramId !== testTgId1 && u.telegramId !== testTgId2));

  const oldLogs = await loadActivityLogs();
  await saveActivityLogs(oldLogs.filter((l) => l.telegramId !== testTgId1 && l.telegramId !== testTgId2));

  // Seed test users & activity logs
  console.log('1. Seeding test users & logs...');
  const user1 = await syncUser({
    telegramId: testTgId1,
    chatId: testTgId1,
    username: 'stats_user_1',
    firstName: 'Stat1',
    languageCode: 'uz',
    isPremium: true,
  });

  const user2 = await syncUser({
    telegramId: testTgId2,
    chatId: testTgId2,
    username: 'stats_user_2',
    firstName: 'Stat2',
    languageCode: 'ru',
    isPremium: false,
  });

  await logStart({ telegramId: testTgId1, message: '/start' });
  await logCommand({ telegramId: testTgId1, message: '/help' });
  await logAI({ telegramId: testTgId1, message: 'AI question' });
  await logText({ telegramId: testTgId2, message: 'Hello stats' });

  // ── TEST PUBLIC FUNCTIONS ──────────────────────────────────────────────
  console.log('\n2. Testing Individual Metric Functions...');

  const totalUsers = await getTotalUsers();
  console.log('  ✅ getTotalUsers():', totalUsers);
  if (totalUsers < 2) throw new Error('Expected at least 2 total users');

  const activeTodayCount = await getActiveUsersTodayCount();
  console.log('  ✅ getActiveUsersTodayCount():', activeTodayCount);

  const newToday = await getNewUsersToday();
  console.log('  ✅ getNewUsersToday():', newToday);

  const newWeek = await getNewUsersThisWeek();
  console.log('  ✅ getNewUsersThisWeek():', newWeek);

  const newMonth = await getNewUsersThisMonth();
  console.log('  ✅ getNewUsersThisMonth():', newMonth);

  const premiumCount = await getPremiumUsersCount();
  console.log('  ✅ getPremiumUsersCount():', premiumCount);

  const totalMsg = await getTotalMessages();
  console.log('  ✅ getTotalMessages():', totalMsg);

  const totalCmd = await getTotalCommands();
  console.log('  ✅ getTotalCommands():', totalCmd);

  const totalAI = await getTotalAIRequests();
  console.log('  ✅ getTotalAIRequests():', totalAI);

  const totalLogs = await getTotalLogs();
  console.log('  ✅ getTotalLogs():', totalLogs);

  // ── TEST OVERVIEW ──────────────────────────────────────────────────────
  console.log('\n3. Testing getOverview()...');
  const overview = await getOverview();
  console.log('  ✅ getOverview() output:', JSON.stringify(overview, null, 2));

  if (typeof overview.totalUsers !== 'number') throw new Error('Expected totalUsers in overview');
  if (typeof overview.totalLogs !== 'number') throw new Error('Expected totalLogs in overview');

  // ── TEST ACTION STATISTICS ─────────────────────────────────────────────
  console.log('\n4. Testing getActionStatistics()...');
  const actionStats = await getActionStatistics();
  console.log('  ✅ Action START count:', actionStats.START);
  console.log('  ✅ Action COMMAND count:', actionStats.COMMAND);
  console.log('  ✅ Action AI_CHAT count:', actionStats.AI_CHAT);
  console.log('  ✅ Action TEXT count:', actionStats.TEXT);

  if (actionStats.START < 1) throw new Error('Expected START action >= 1');
  if (actionStats.AI_CHAT < 1) throw new Error('Expected AI_CHAT action >= 1');

  // ── TEST LANGUAGE STATISTICS ───────────────────────────────────────────
  console.log('\n5. Testing getLanguageStatistics()...');
  const langStats = await getLanguageStatistics();
  console.log('  ✅ Language stats output:', JSON.stringify(langStats));
  if ((langStats['uz'] || 0) < 1) throw new Error('Expected uz language count >= 1');

  // ── TEST DAILY STATISTICS ──────────────────────────────────────────────
  console.log('\n6. Testing getDailyStatistics()...');
  const dailyStats = await getDailyStatistics();
  console.log('  ✅ Daily stats output:', JSON.stringify(dailyStats, null, 2));

  // Clean up test records
  const finalUsers = await loadUsers();
  await saveUsers(finalUsers.filter((u) => u.telegramId !== testTgId1 && u.telegramId !== testTgId2));

  const finalLogs = await loadActivityLogs();
  await saveActivityLogs(finalLogs.filter((l) => l.telegramId !== testTgId1 && l.telegramId !== testTgId2));

  console.log('\n========================================');
  console.log('=== ALL STATISTICS TESTS PASSED 100% ===');
  console.log('========================================');
}

testStatisticsService().catch((err) => {
  console.error('Statistics service test failed:', err);
  process.exit(1);
});
