import { Markup } from 'telegraf';
import { getUserById, getLatestUserActivity } from '../database';
import { formatRelativeTime } from './adminUsers';

export const TIMELINE_PLACEHOLDER = '🚧 Timeline keyingi phaseda quriladi.';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'No activity recorded';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'No activity recorded';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Renders the HTML User Profile page using Query Engine.
 */
export async function renderUserProfileText(userId: string): Promise<string | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const latestActivity = await getLatestUserActivity(userId);

  const firstName = user.firstName ? escapeHtml(user.firstName) : 'No Name';
  const lastName = user.lastName ? ` ${escapeHtml(user.lastName)}` : '';
  const fullName = `${firstName}${lastName}`.trim();

  const username = user.username ? `@${escapeHtml(user.username)}` : 'None';
  const isPremiumStr = user.isPremium ? 'Yes' : 'No';
  const langStr = user.languageCode ? escapeHtml(user.languageCode) : 'N/A';
  const regDate = formatDate(user.registeredAt || user.createdAt);
  const lastActive = formatRelativeTime(user.lastActive || user.updatedAt);

  let latestActText = 'No activity recorded';
  if (latestActivity) {
    const actTime = formatDateTime(latestActivity.createdAt);
    latestActText = `<b>${escapeHtml(latestActivity.action)}</b>\n\n${actTime}`;
  }

  return `👤 <b>User Profile</b>

━━━━━━━━━━━━━━━━━━

🆔 <b>ID:</b>
<code>${user.id}</code>

👤 <b>Name:</b>
${fullName}

📛 <b>Username:</b>
${username}

🆔 <b>Telegram ID:</b>
<code>${user.telegramId}</code>

💎 <b>Premium:</b>
${isPremiumStr}

🌍 <b>Language:</b>
${langStr}

💬 <b>Messages:</b>
${user.messageCount || 0}

⌨ <b>Commands:</b>
${user.commandCount || 0}

🤖 <b>AI Requests:</b>
${user.aiRequestCount || 0}

📅 <b>Registered:</b>
${regDate}

🟢 <b>Last Active:</b>
${lastActive}

━━━━━━━━━━━━━━━━━━

📜 <b>Latest Activity</b>

${latestActText}

━━━━━━━━━━━━━━━━━━`;
}

/**
 * Builds the User Profile inline keyboard with Timeline, Users, and Dashboard buttons.
 */
export function getUserProfileKeyboard(userId: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📜 Timeline', `admin_user_timeline_${userId}`)],
    [Markup.button.callback('🔙 Users', 'admin_users')],
    [Markup.button.callback('🏠 Dashboard', 'admin_dashboard')],
  ]);
}
