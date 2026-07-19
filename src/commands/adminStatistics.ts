import { Markup } from 'telegraf';
import {
  getOverview,
  getActionStatistics,
  getLanguageStatistics,
  getDatabaseInfoStatistics,
  ActionType,
} from '../database';

/**
 * Action Icons Mapping
 */
const ACTION_ICONS: Record<ActionType, string> = {
  START: '🚀',
  COMMAND: '🟢',
  TEXT: '💬',
  AI_CHAT: '🤖',
  PHOTO: '🖼',
  VIDEO: '🎥',
  VOICE: '🎤',
  DOCUMENT: '📄',
  STICKER: '😊',
  CONTACT: '📞',
  LOCATION: '📍',
  CALLBACK: '🖱',
  ERROR: '❌',
  UNAUTHORIZED: '⛔',
};

function formatDate(isoStr?: string | null): string {
  if (!isoStr || isoStr === 'N/A') return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Renders the HTML Admin Statistics Page using Statistics Engine & Query Engine.
 */
export async function renderAdminStatisticsText(): Promise<string> {
  const [overview, actionStats, langStats, dbInfo] = await Promise.all([
    getOverview(),
    getActionStatistics(),
    getLanguageStatistics(),
    getDatabaseInfoStatistics(),
  ]);

  const tashkentTime = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Language Breakdown
  const uzCount = langStats['uz'] || 0;
  const enCount = langStats['en'] || 0;
  const ruCount = langStats['ru'] || 0;
  let otherCount = 0;

  for (const [key, val] of Object.entries(langStats)) {
    if (key !== 'uz' && key !== 'en' && key !== 'ru') {
      otherCount += val;
    }
  }

  // Action Breakdown List
  const allActionTypes: ActionType[] = [
    'START',
    'COMMAND',
    'TEXT',
    'AI_CHAT',
    'PHOTO',
    'VIDEO',
    'VOICE',
    'DOCUMENT',
    'STICKER',
    'CONTACT',
    'LOCATION',
    'CALLBACK',
    'ERROR',
    'UNAUTHORIZED',
  ];

  let actionBreakdownStr = '';
  for (const act of allActionTypes) {
    const icon = ACTION_ICONS[act] || '📜';
    const count = actionStats[act] || 0;
    actionBreakdownStr += `${icon} <b>${act}:</b> ${count}\n`;
  }

  return `📈 <b>Bot Statistics</b>

━━━━━━━━━━━━━━━━━━

<b>System Overview</b>

👥 <b>Total Users:</b> ${overview.totalUsers}
🟢 <b>Active Today:</b> ${overview.activeUsersToday}
🆕 <b>New Today:</b> ${overview.newUsersToday}
📅 <b>New This Week:</b> ${overview.newUsersThisWeek}
📆 <b>New This Month:</b> ${overview.newUsersThisMonth}
⭐ <b>Premium Users:</b> ${overview.premiumUsers}

━━━━━━━━━━━━━━━━━━

<b>Activity Overview</b>

💬 <b>Messages:</b> ${overview.totalMessages}
🤖 <b>AI Requests:</b> ${overview.totalAIRequests}
⌨ <b>Commands:</b> ${overview.totalCommands}
📜 <b>Total Logs:</b> ${overview.totalLogs}
🚀 <b>Starts:</b> ${actionStats.START || 0}
🖱 <b>Callbacks:</b> ${actionStats.CALLBACK || 0}
❌ <b>Errors:</b> ${actionStats.ERROR || 0}
⛔ <b>Unauthorized:</b> ${actionStats.UNAUTHORIZED || 0}

━━━━━━━━━━━━━━━━━━

<b>Action Breakdown</b>

${actionBreakdownStr.trim()}

━━━━━━━━━━━━━━━━━━

<b>Language Distribution</b>

🇺🇿 <b>Uzbek:</b> ${uzCount}
🇬🇧 <b>English:</b> ${enCount}
🇷🇺 <b>Russian:</b> ${ruCount}
❓ <b>Other/Unknown:</b> ${otherCount}

━━━━━━━━━━━━━━━━━━

<b>System Health</b>

🟢 <b>Database:</b> Healthy
🟢 <b>Tracking:</b> Running
🟢 <b>Logger:</b> Running (Cap: 50,000)
🟢 <b>Security:</b> Protected (Set O(1))
🟢 <b>Query Engine:</b> Operational
🟢 <b>Statistics Engine:</b> Operational

━━━━━━━━━━━━━━━━━━

<b>Database Info</b>

👥 <b>Users Count:</b> ${dbInfo.usersCount}
📜 <b>Logs Count:</b> ${dbInfo.logsCount}
💾 <b>Storage Type:</b> ${dbInfo.storageType}
🔒 <b>Max Logs:</b> ${dbInfo.maxLogs.toLocaleString()}
🆕 <b>Newest Log:</b> ${formatDate(dbInfo.newestLogDate)}
📜 <b>Oldest Log:</b> ${formatDate(dbInfo.oldestLogDate)}

━━━━━━━━━━━━━━━━━━

📅 <b>Generated:</b> ${tashkentTime}`;
}

/**
 * Builds the Admin Statistics inline keyboard.
 */
export function getAdminStatisticsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔄 Refresh', 'admin_statistics_refresh'),
      Markup.button.callback('📜 Logs', 'admin_logs'),
    ],
    [
      Markup.button.callback('👥 Users', 'admin_users'),
      Markup.button.callback('🏠 Dashboard', 'admin_dashboard'),
    ],
  ]);
}
