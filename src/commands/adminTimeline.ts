import { Markup } from 'telegraf';
import { getUserById, getLogsByUser, ActivityLog } from '../database';

export const LOGS_PER_PAGE = 10;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export interface PaginatedTimelineResult {
  text: string;
  logs: ActivityLog[];
  page: number;
  totalPages: number;
  totalLogs: number;
  userExists: boolean;
}

/**
 * Renders the HTML Activity Timeline page for a specific user and page number using Query Engine.
 */
export async function renderUserTimelineText(
  userId: string,
  page: number = 1
): Promise<PaginatedTimelineResult> {
  const user = await getUserById(userId);
  if (!user) {
    return {
      text: '⚠️ User not found.',
      logs: [],
      page: 1,
      totalPages: 1,
      totalLogs: 0,
      userExists: false,
    };
  }

  const logs = await getLogsByUser(userId); // Sorted newest -> oldest
  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / LOGS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const pageLogs = logs.slice(startIndex, startIndex + LOGS_PER_PAGE);

  const name =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.username ||
    `User ${user.telegramId}`;

  let text = `📜 <b>Activity Timeline</b>\n\n`;
  text += `👤 <b>User:</b> ${escapeHtml(name)}\n`;
  text += `<b>Total Logs:</b> ${totalLogs}\n`;
  if (totalPages > 1) {
    text += `<b>Page:</b> ${currentPage} / ${totalPages}\n`;
  }
  text += `\n━━━━━━━━━━━━━━━━━━\n\n`;

  if (pageLogs.length === 0) {
    text += `<i>No activity logs recorded for this user.</i>\n\n━━━━━━━━━━━━━━━━━━`;
  } else {
    pageLogs.forEach((l, idx) => {
      const num = startIndex + idx + 1;
      const actDate = formatDateTime(l.createdAt);
      text += `${num}.\n\n<b>${escapeHtml(l.action)}</b>\n\n${actDate}\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    });
  }

  return {
    text: text.trim(),
    logs: pageLogs,
    page: currentPage,
    totalPages,
    totalLogs,
    userExists: true,
  };
}

/**
 * Builds the inline keyboard for the Activity Timeline page.
 */
export function getUserTimelineKeyboard(userId: string, page: number, totalPages: number) {
  const keyboard: any[][] = [];

  // Pagination navigation row (Previous / Next)
  const navRow: any[] = [];
  if (page > 1) {
    navRow.push(Markup.button.callback('⬅ Previous', `admin_timeline_page_${userId}_${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(Markup.button.callback('➡ Next', `admin_timeline_page_${userId}_${page + 1}`));
  }
  if (navRow.length > 0) {
    keyboard.push(navRow);
  }

  // Navigation row: Profile, Users, Dashboard
  keyboard.push([
    Markup.button.callback('👤 Profile', `admin_user_${userId}`),
    Markup.button.callback('👥 Users', 'admin_users'),
    Markup.button.callback('🏠 Dashboard', 'admin_dashboard'),
  ]);

  return Markup.inlineKeyboard(keyboard);
}
