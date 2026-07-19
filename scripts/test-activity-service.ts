import {
  createLog,
  logStart,
  logCommand,
  logAI,
  logText,
  logPhoto,
  logVoice,
  logDocument,
  logLocation,
  logContact,
  logCallback,
  logError,
  loadActivityLogs,
  saveActivityLogs,
  MAX_LOGS,
} from '../src/database';

async function testActivityService() {
  console.log('=== ACTIVITY LOGGER SERVICE TEST SUITE ===\n');

  const testTelegramId = 888777666;

  // Clean up test logs before test
  const existingLogs = await loadActivityLogs();
  await saveActivityLogs(existingLogs.filter((l) => l.telegramId !== testTelegramId));

  // 1. Test creating logs with helper methods
  console.log('1. Testing Helper Log Functions...');

  const startLog = await logStart({ telegramId: testTelegramId, message: '/start' });
  console.log('  ✅ logStart created ID:', startLog.id, 'Action:', startLog.action);
  if (startLog.action !== 'START') throw new Error('Expected START action');

  const cmdLog = await logCommand({ telegramId: testTelegramId, message: '/help' });
  console.log('  ✅ logCommand created Action:', cmdLog.action);
  if (cmdLog.action !== 'COMMAND') throw new Error('Expected COMMAND action');

  const aiLog = await logAI({ telegramId: testTelegramId, message: 'What is Node.js?' });
  console.log('  ✅ logAI created Action:', aiLog.action);
  if (aiLog.action !== 'AI_CHAT') throw new Error('Expected AI_CHAT action');

  const textLog = await logText({ telegramId: testTelegramId, message: 'Hello bot' });
  console.log('  ✅ logText created Action:', textLog.action);
  if (textLog.action !== 'TEXT') throw new Error('Expected TEXT action');

  const photoLog = await logPhoto({ telegramId: testTelegramId, message: 'Beautiful landscape' });
  console.log('  ✅ logPhoto created Action:', photoLog.action);

  const voiceLog = await logVoice({ telegramId: testTelegramId, message: '' });
  console.log('  ✅ logVoice created Action:', voiceLog.action);

  const docLog = await logDocument({ telegramId: testTelegramId, message: 'CV.pdf' });
  console.log('  ✅ logDocument created Action:', docLog.action);

  const locLog = await logLocation({ telegramId: testTelegramId });
  console.log('  ✅ logLocation created Action:', locLog.action);

  const contactLog = await logContact({ telegramId: testTelegramId });
  console.log('  ✅ logContact created Action:', contactLog.action);

  const cbLog = await logCallback({ telegramId: testTelegramId, message: 'btn_click' });
  console.log('  ✅ logCallback created Action:', cbLog.action);

  const errLog = await logError({ telegramId: testTelegramId, message: 'Something went wrong' });
  console.log('  ✅ logError created Action:', errLog.action);

  // 2. Test reading saved logs
  const logsAfter = await loadActivityLogs();
  const testLogs = logsAfter.filter((l) => l.telegramId === testTelegramId);
  console.log('\n2. Testing Log Persistence...');
  console.log('  ✅ Total test logs saved:', testLogs.length);
  if (testLogs.length < 11) throw new Error('Expected at least 11 logs saved');

  // 3. Test MAX_LOGS constant export
  console.log('\n3. Testing MAX_LOGS configuration...');
  console.log('  ✅ MAX_LOGS limit is set to:', MAX_LOGS);
  if (MAX_LOGS !== 50000) throw new Error('Expected MAX_LOGS to be 50000');

  // Cleanup test logs
  const finalLogs = await loadActivityLogs();
  await saveActivityLogs(finalLogs.filter((l) => l.telegramId !== testTelegramId));

  console.log('\n========================================');
  console.log('=== ALL ACTIVITY LOGGER TESTS PASSED 100% ===');
  console.log('========================================');
}

testActivityService().catch((err) => {
  console.error('Activity service test failed:', err);
  process.exit(1);
});
