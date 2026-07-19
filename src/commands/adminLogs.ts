import { Markup } from 'telegraf';
import { ActionType } from '../database/types';
import { getPaginatedLogs, getUserByTelegramId, getUserById } from '../database/queryService';

export const LOGS_VIEWER_LIMIT = 10;

/**
 * Action Icons Mapping
 */
export const ACTION_ICONS: Record<ActionType, string> = {
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

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Formats date as "19 Jul 2026"
 */
function formatDate(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats time as "18:25"
 */
function formatTime(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return `${hh}:${mm}`;
}

/**
 * Formats message preview string based on action type.
 */
export function formatMessagePreview(action: ActionType, message?: string | null): string {
  if (action === 'PHOTO') return '[Photo]';
  if (action === 'VIDEO') return '[Video]';
  if (action === 'VOICE') return '[Voice]';
  if (action === 'DOCUMENT') return '[Document]';
  if (action === 'STICKER') return '[Sticker]';
  if (action === 'CONTACT') return '[Contact]';
  if (action === 'LOCATION') return '[Location]';

  if (!message || !message.trim()) return '[No Message]';

  const clean = message.trim();
  if (action === 'COMMAND' || action === 'START') {
    return escapeHtml(clean);
  }

  // Truncate to first 50 characters for text messages, callbacks, errors, etc.
  if (clean.length > 50) {
    return escapeHtml(clean.slice(0, 50) + '...');
  }

  return escapeHtml(clean);
}

export interface RenderGlobalLogsResult {
  text: string;
  page: number;
  totalPages: number;
  totalLogs: number;
}

/**
 * Renders the HTML Global Activity Logs Viewer page using Query Engine.
 */
export async function renderGlobalLogsText(page: number = 1): Promise<RenderGlobalLogsResult> {
  const paginatedResult = await getPaginatedLogs(page, LOGS_VIEWER_LIMIT);
  const { logs, totalLogs, page: currentPage, totalPages } = paginatedResult;

  const startIndex = totalLogs === 0 ? 0 : (currentPage - 1) * LOGS_VIEWER_LIMIT + 1;
  const endIndex = Math.min(currentPage * LOGS_VIEWER_LIMIT, totalLogs);

  const tashkentTime = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  let text = `📜 <b>Global Activity Logs</b>\n\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;
  text += `<b>Total Logs:</b> ${totalLogs}\n`;
  text += `<b>Page:</b> ${currentPage} / ${totalPages}\n`;
  text += `<b>Showing:</b> ${startIndex}-${endIndex} of ${totalLogs}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;

  if (logs.length === 0) {
    text += `<i>No logs found in database.</i>\n\n━━━━━━━━━━━━━━━━━━\n\n`;
  } else {
    for (const log of logs) {
      // User details resolution
      let name = `User ${log.telegramId}`;
      let usernameStr = 'No username';

      if (log.userId) {
        const u = await getUserById(log.userId);
        if (u) {
          name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || name;
          usernameStr = u.username ? `@${escapeHtml(u.username)}` : 'No username';
        }
      } else {
        const u = await getUserByTelegramId(log.telegramId);
        if (u) {
          name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || name;
          usernameStr = u.username ? `@${escapeHtml(u.username)}` : 'No username';
        }
      }

      const icon = ACTION_ICONS[log.action] || '📜';
      const dateStr = formatDate(log.createdAt);
      const timeStr = formatTime(log.createdAt);
      const preview = formatMessagePreview(log.action, log.message);

      text += `${icon} <b>${log.action}</b>\n\n`;
      text += `👤 <b>${escapeHtml(name)}</b>\n`;
      text += `🆔 <code>${log.telegramId}</code>\n`;
      text += `${usernameStr}\n\n`;
      text += `📅 ${dateStr}\n`;
      text += `🕒 ${timeStr}\n\n`;
      text += `${preview}\n\n`;
      text += `━━━━━━━━━━━━━━━━━━\n\n`;
    }
  }

  text += `📅 <b>Updated:</b> ${tashkentTime}`;

  return {
    text: text.trim(),
    page: currentPage,
    totalPages,
    totalLogs,
  };
}

/**
 * Builds inline keyboard for Global Activity Logs Viewer.
 */
export function getGlobalLogsKeyboard(page: number, totalPages: number) {
  const keyboard: any[][] = [];

  // Row 1: Pagination buttons (Previous / Next)
  const navRow: any[] = [];
  if (page > 1) {
    navRow.push(Markup.button.callback('⬅ Previous', `admin_logs_page_${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(Markup.button.callback('➡ Next', `admin_logs_page_${page + 1}`));
  }
  if (navRow.length > 0) {
    keyboard.push(navRow);
  }

  // Row 2: Refresh & Dashboard
  keyboard.push([
    Markup.button.callback('🔄 Refresh', `admin_logs_page_${page}`),
    Markup.button.callback('🏠 Dashboard', 'admin_dashboard'),
  ]);

  return Markup.inlineKeyboard(keyboard);
}
