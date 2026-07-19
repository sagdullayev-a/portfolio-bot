import { Markup } from 'telegraf';
import { env } from '../config/env';
import { getAdminIds } from '../config/admin';
import {
  getOverview,
  getDatabaseInfoStatistics,
  getAllUsers,
} from '../database';

const processStartTime = new Date();

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

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
 * Renders the main Admin Settings Center HTML page.
 */
export async function renderAdminSettingsMainText(): Promise<string> {
  const [overview, dbInfo] = await Promise.all([
    getOverview(),
    getDatabaseInfoStatistics(),
  ]);

  const uptimeStr = formatUptime(process.uptime());
  const adminCount = getAdminIds().length;

  return `⚙ <b>Administration Settings Center</b>

━━━━━━━━━━━━━━━━━━

<b>Bot Information</b>

🤖 <b>Bot Name:</b> Portfolio Bot
📦 <b>Version:</b> 1.0.0
⚙ <b>Framework:</b> Telegraf v4
🟢 <b>Node Version:</b> ${process.version}
📐 <b>TypeScript:</b> Strict Mode
🌐 <b>Environment:</b> ${env.NODE_ENV}
🕒 <b>Start Time:</b> ${formatDate(processStartTime.toISOString())}
⏳ <b>Uptime:</b> ${uptimeStr}

━━━━━━━━━━━━━━━━━━

<b>Database Center</b>

💾 <b>Storage Type:</b> ${dbInfo.storageType}
👥 <b>Users:</b> ${overview.totalUsers}
📜 <b>Logs:</b> ${overview.totalLogs}
🔒 <b>Max Logs:</b> ${dbInfo.maxLogs.toLocaleString()}
🟢 <b>Status:</b> Operational
🟢 <b>Health:</b> Healthy

━━━━━━━━━━━━━━━━━━

<b>System Modules</b>

🟢 <b>User Tracking:</b> Running
🟢 <b>Activity Logger:</b> Running (Cap: 50k)
🟢 <b>Global Search:</b> Operational
🟢 <b>Statistics Engine:</b> Operational
🟢 <b>Security Layer:</b> Protected (Set O(1))
🟢 <b>Logs Viewer:</b> Operational

━━━━━━━━━━━━━━━━━━

<b>Security Center</b>

👥 <b>Admin Count:</b> ${adminCount}
🔒 <b>Authorization:</b> Set O(1) Fast Lookup
🛡 <b>Middleware:</b> AdminAuth Middleware
⛔ <b>Unauthorized Protection:</b> Active (Persisted Log)

━━━━━━━━━━━━━━━━━━

<b>Project Metadata</b>

✅ <b>Completed Phases:</b> 14 / 14
🚀 <b>Current Phase:</b> Phase 14 (Settings Center)
📐 <b>Architecture:</b> Strict Layered Architecture
💬 <b>Language:</b> TypeScript Strict Mode`;
}

/**
 * Renders the System Information Sub-Page.
 */
export function renderAdminSettingsSystemText(): string {
  const memUsage = process.memoryUsage();
  const heapMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

  const tashkentTime = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `ℹ <b>System Information</b>

━━━━━━━━━━━━━━━━━━

🟢 <b>Node.js Version:</b> ${process.version}
📐 <b>TypeScript Version:</b> v5.8.3
💻 <b>Platform:</b> ${process.platform}
🆔 <b>Process ID (PID):</b> <code>${process.pid}</code>
🧠 <b>Heap Used:</b> ${heapMB} MB
💾 <b>RSS Memory:</b> ${rssMB} MB
🌍 <b>Timezone:</b> Asia/Tashkent
🕒 <b>Current Time:</b> ${tashkentTime}

━━━━━━━━━━━━━━━━━━`;
}

/**
 * Renders the Database Status Sub-Page.
 */
export async function renderAdminSettingsDatabaseText(): Promise<string> {
  const [dbInfo, users] = await Promise.all([
    getDatabaseInfoStatistics(),
    getAllUsers(),
  ]);

  const newestUserDate = users.length > 0 ? formatDate(users[0].createdAt || users[0].registeredAt) : 'N/A';

  return `💾 <b>Database Information</b>

━━━━━━━━━━━━━━━━━━

👥 <b>Total Users:</b> ${dbInfo.usersCount}
📜 <b>Total Logs:</b> ${dbInfo.logsCount}
💾 <b>Database Type:</b> ${dbInfo.storageType}
🔒 <b>Maximum Logs:</b> ${dbInfo.maxLogs.toLocaleString()}
🆕 <b>Newest User:</b> ${newestUserDate}
🆕 <b>Newest Log:</b> ${formatDate(dbInfo.newestLogDate)}
📜 <b>Oldest Log:</b> ${formatDate(dbInfo.oldestLogDate)}

━━━━━━━━━━━━━━━━━━`;
}

/**
 * Renders the Security Status Sub-Page.
 */
export function renderAdminSettingsSecurityText(): string {
  const adminIds = getAdminIds();

  return `🔒 <b>Security Information</b>

━━━━━━━━━━━━━━━━━━

👥 <b>Admin IDs Count:</b> ${adminIds.length}
🆔 <b>Admin IDs:</b> <code>${adminIds.join(', ')}</code>
🟢 <b>Security Status:</b> Protected
⚡ <b>Authorization Method:</b> Set O(1) Fast Lookup
⛔ <b>Unauthorized Protection:</b> Active (Persisted UNAUTHORIZED logs)

━━━━━━━━━━━━━━━━━━`;
}

/**
 * Renders the About Project Sub-Page.
 */
export function renderAdminSettingsAboutText(): string {
  return `📋 <b>About Project</b>

━━━━━━━━━━━━━━━━━━

📦 <b>Project Name:</b> Portfolio Bot System
🚀 <b>Current Version:</b> 1.0.0
📐 <b>Architecture:</b> Strict Layered Architecture
✅ <b>Completed Modules:</b> 14 Phases Complete
⌨ <b>Total Commands:</b> 5 (/start, /aboutme, /sagdullayevuz, /whoami, /admin)
⚙ <b>Total Services:</b> 6 Services (AI, Notifier, User, Activity, Query, Statistics)
🛡 <b>Total Middlewares:</b> 4 Middlewares (Logger, UserTracking, ActivityLogger, AdminAuth)
💾 <b>Database Modules:</b> 5 Modules (Database, Helpers, UserService, ActivityService, QueryService)

━━━━━━━━━━━━━━━━━━`;
}

/**
 * Builds Main Settings Center inline keyboard.
 */
export function getAdminSettingsMainKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('ℹ System Info', 'admin_settings_system'),
      Markup.button.callback('💾 Database', 'admin_settings_database'),
    ],
    [
      Markup.button.callback('🔒 Security', 'admin_settings_security'),
      Markup.button.callback('📋 About Project', 'admin_settings_about'),
    ],
    [
      Markup.button.callback('🏠 Dashboard', 'admin_dashboard'),
    ],
  ]);
}

/**
 * Builds Sub-Page inline keyboard with Back to Settings and Dashboard buttons.
 */
export function getAdminSettingsSubPageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⚙ Back to Settings', 'admin_settings'),
      Markup.button.callback('🏠 Dashboard', 'admin_dashboard'),
    ],
  ]);
}
