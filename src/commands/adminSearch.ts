import { Telegraf, Context, Markup } from 'telegraf';
import { isAdmin } from '../config/admin';
import { getUserById, searchUsers, User } from '../database';
import { formatRelativeTime } from './adminUsers';

// Active search sessions set: admin Telegram ID
const activeSearchSessions = new Set<number>();

export function startSearchSession(telegramId: number): void {
  activeSearchSessions.add(telegramId);
}

export function clearSearchSession(telegramId: number): void {
  activeSearchSessions.delete(telegramId);
}

export function hasActiveSearchSession(telegramId: number): boolean {
  return activeSearchSessions.has(telegramId);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const SEARCH_PROMPT_TEXT = `🔎 <b>Qidiruv uchun quyidagilardan birini yuboring:</b>

• Ism
• Username
• Telegram ID
• User ID`;

export const NOT_FOUND_TEXT = `❌ <b>Hech qanday foydalanuvchi topilmadi.</b>`;

/**
 * Performs global user search across UUID, Telegram ID, Username, First Name, and Last Name using Query Engine.
 */
export async function performGlobalSearch(query: string): Promise<User[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. Check exact UUID match
  const byId = await getUserById(cleanQuery);
  if (byId) return [byId];

  // 2. Search by keyword (Telegram ID, Username, First Name, Last Name)
  return searchUsers(cleanQuery);
}

/**
 * Renders HTML search result text.
 */
export function renderSearchResultText(users: User[]): string {
  if (users.length === 0) return NOT_FOUND_TEXT;

  if (users.length === 1) {
    const u = users[0];
    const firstName = u.firstName ? escapeHtml(u.firstName) : 'No Name';
    const lastName = u.lastName ? ` ${escapeHtml(u.lastName)}` : '';
    const fullName = `${firstName}${lastName}`.trim();
    const username = u.username ? `@${escapeHtml(u.username)}` : 'None';
    const lastActive = formatRelativeTime(u.lastActive || u.updatedAt);

    return `🔎 <b>Qidiruv Natijasi</b>

━━━━━━━━━━━━━━━━━━

👤 <b>Name:</b>
${fullName}

📛 <b>Username:</b>
${username}

🆔 <b>Telegram ID:</b>
<code>${u.telegramId}</code>

🆔 <b>User ID:</b>
<code>${u.id}</code>

🟢 <b>Last Active:</b>
${lastActive}

━━━━━━━━━━━━━━━━━━`;
  }

  let text = `🔎 <b>Qidiruv Natijalari (${users.length} ta topildi)</b>\n\n━━━━━━━━━━━━━━━━━━\n\n`;
  users.slice(0, 5).forEach((u, idx) => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name';
    const username = u.username ? `@${u.username}` : 'No username';
    text += `${idx + 1}. <b>${escapeHtml(name)}</b> (${escapeHtml(username)}) - ID: <code>${u.telegramId}</code>\n`;
  });
  text += `\n━━━━━━━━━━━━━━━━━━`;
  return text;
}

/**
 * Builds search result inline keyboard.
 */
export function getSearchResultKeyboard(users: User[]) {
  const keyboard: any[][] = [];

  if (users.length === 1) {
    keyboard.push([Markup.button.callback('👤 Open Profile', `admin_user_${users[0].id}`)]);
  } else if (users.length > 1) {
    users.slice(0, 5).forEach((u) => {
      const name = u.firstName || u.username || `User ${u.telegramId}`;
      keyboard.push([Markup.button.callback(`👤 Open ${name}`, `admin_user_${u.id}`)]);
    });
  } else {
    keyboard.push([Markup.button.callback('🔍 Qayta qidirish', 'admin_search')]);
  }

  keyboard.push([Markup.button.callback('🏠 Dashboard', 'admin_dashboard')]);
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Builds search prompt inline keyboard with Cancel button.
 */
export function getSearchPromptKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❌ Cancel', 'admin_search_cancel')],
  ]);
}

/**
 * Registers text listener for active admin search sessions.
 */
export function registerAdminSearchTextHandler(bot: Telegraf<Context>): void {
  bot.on('text', async (ctx, next) => {
    const telegramId = ctx.from?.id;

    if (telegramId && isAdmin(telegramId) && hasActiveSearchSession(telegramId)) {
      clearSearchSession(telegramId);
      const query = ctx.message.text;

      try {
        const results = await performGlobalSearch(query);
        const text = renderSearchResultText(results);
        await ctx.replyWithHTML(text, getSearchResultKeyboard(results));
        return;
      } catch (err) {
        console.error('[adminSearch] Error performing search:', err);
        await ctx.reply('⚠️ Error performing search.');
        return;
      }
    }

    return next();
  });
}
