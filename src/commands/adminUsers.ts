import { Markup } from 'telegraf';
import { getAllUsers, User } from '../database';

export const USERS_PER_PAGE = 10;
export const USER_PROFILE_PLACEHOLDER = '🚧 User Profile keyingi phaseda quriladi.';

/**
 * Formats an ISO date string into relative human-readable time.
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return 'Unknown';

  const diffMs = Date.now() - d;
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Just now';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export interface PaginatedUsersResult {
  text: string;
  users: User[];
  page: number;
  totalPages: number;
  totalUsers: number;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Renders the Paginated Users List text for a specific page using Query Engine.
 */
export async function renderUsersPageText(page: number = 1): Promise<PaginatedUsersResult> {
  const allUsers = await getAllUsers();
  const totalUsers = allUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const pageUsers = allUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  let text = `👥 <b>Users</b>\n\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;
  text += `<b>Total:</b>\n${totalUsers}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;

  if (pageUsers.length === 0) {
    text += `<i>No users found in database.</i>\n\n━━━━━━━━━━━━━━━━━━`;
  } else {
    pageUsers.forEach((u, idx) => {
      const num = startIndex + idx + 1;
      const firstName = u.firstName ? escapeHtml(u.firstName) : 'No Name';
      const lastName = u.lastName ? ` ${escapeHtml(u.lastName)}` : '';
      const fullName = `${firstName}${lastName}`;
      const username = u.username ? `@${escapeHtml(u.username)}` : 'No username';
      const lastActive = formatRelativeTime(u.lastActive || u.updatedAt);

      text += `${num}.\n${fullName}\n${username}\n\n<b>Last Active:</b>\n${lastActive}\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    });
  }

  return {
    text: text.trim(),
    users: pageUsers,
    page: currentPage,
    totalPages,
    totalUsers,
  };
}

/**
 * Builds the inline keyboard for a paginated users list page.
 */
export function getUsersPageKeyboard(page: number, totalPages: number, pageUsers: User[]) {
  const keyboard: any[][] = [];

  // User profile buttons (1 or 2 per row)
  for (let i = 0; i < pageUsers.length; i += 2) {
    const row: any[] = [];
    const u1 = pageUsers[i];
    const name1 = u1.firstName || u1.username || `User ${u1.telegramId}`;
    row.push(Markup.button.callback(`👤 ${name1}`, `admin_user_${u1.id}`));

    if (i + 1 < pageUsers.length) {
      const u2 = pageUsers[i + 1];
      const name2 = u2.firstName || u2.username || `User ${u2.telegramId}`;
      row.push(Markup.button.callback(`👤 ${name2}`, `admin_user_${u2.id}`));
    }
    keyboard.push(row);
  }

  // Pagination navigation row (Previous / Next)
  const navRow: any[] = [];
  if (page > 1) {
    navRow.push(Markup.button.callback('⬅ Previous', `admin_users_page_${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(Markup.button.callback('➡ Next', `admin_users_page_${page + 1}`));
  }
  if (navRow.length > 0) {
    keyboard.push(navRow);
  }

  // Dashboard back button
  keyboard.push([Markup.button.callback('🔙 Dashboard', 'admin_dashboard')]);

  return Markup.inlineKeyboard(keyboard);
}
