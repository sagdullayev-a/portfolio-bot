import { Telegraf, Context, Markup } from 'telegraf';
import { adminAuthMiddleware } from '../middlewares/adminAuth';
import { getOverview } from '../database';

export const ADMIN_PLACEHOLDER_MESSAGE = '🚧 Bu modul keyingi phaseda quriladi.';

/**
 * Renders the Admin Dashboard HTML text using Statistics Engine.
 */
export async function renderAdminDashboardText(): Promise<string> {
  const overview = await getOverview();

  const tashkentTime = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `📊 <b>Admin Dashboard</b>

━━━━━━━━━━━━━━━━━━

👥 <b>Users:</b>
${overview.totalUsers}

🟢 <b>Active Today:</b>
${overview.activeUsersToday}

🆕 <b>New Today:</b>
${overview.newUsersToday}

⭐ <b>Premium:</b>
${overview.premiumUsers}

━━━━━━━━━━━━━━━━━━

💬 <b>Messages:</b>
${overview.totalMessages}

🤖 <b>AI Requests:</b>
${overview.totalAIRequests}

⌨ <b>Commands:</b>
${overview.totalCommands}

📜 <b>Logs:</b>
${overview.totalLogs}

━━━━━━━━━━━━━━━━━━

📅 <b>Updated:</b>
${tashkentTime}`;
}

/**
 * Returns the Admin Dashboard inline keyboard.
 */
export function getAdminDashboardKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👥 Users', 'admin_users'),
      Markup.button.callback('📈 Statistics', 'admin_stats'),
    ],
    [
      Markup.button.callback('📜 Timeline', 'admin_timeline'),
      Markup.button.callback('🔍 Search', 'admin_search'),
    ],
    [
      Markup.button.callback('⚙ Settings', 'admin_settings'),
    ],
  ]);
}

/**
 * Registers /admin command and callback query handlers for the dashboard.
 */
export function registerAdminDashboardCommand(bot: Telegraf<Context>): void {
  // /admin command - protected by adminAuthMiddleware
  bot.command('admin', adminAuthMiddleware, async (ctx) => {
    try {
      const text = await renderAdminDashboardText();
      await ctx.replyWithHTML(text, getAdminDashboardKeyboard());
    } catch (err) {
      console.error('[adminDashboard] Error rendering dashboard:', err);
      await ctx.reply('⚠️ Error loading admin dashboard.');
    }
  });

  // admin_* callback buttons - protected by adminAuthMiddleware
  bot.action(/^admin_(.+)$/, adminAuthMiddleware, async (ctx) => {
    try {
      await ctx.answerCbQuery(ADMIN_PLACEHOLDER_MESSAGE, { show_alert: true });
    } catch (err) {
      console.error('[adminDashboard] Error answering callback:', err);
    }
  });
}
