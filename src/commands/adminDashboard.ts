import { Telegraf, Context, Markup } from 'telegraf';
import { adminAuthMiddleware } from '../middlewares/adminAuth';
import { getOverview } from '../database';
import {
  renderUsersPageText,
  getUsersPageKeyboard,
} from './adminUsers';
import {
  renderUserProfileText,
  getUserProfileKeyboard,
} from './adminUserProfile';
import {
  renderUserTimelineText,
  getUserTimelineKeyboard,
} from './adminTimeline';

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
 * Registers /admin command and callback query handlers for Dashboard, Users, User Profile, and Timeline.
 */
export function registerAdminDashboardCommand(bot: Telegraf<Context>): void {
  // 1. /admin command - protected by adminAuthMiddleware
  bot.command('admin', adminAuthMiddleware, async (ctx) => {
    try {
      const text = await renderAdminDashboardText();
      await ctx.replyWithHTML(text, getAdminDashboardKeyboard());
    } catch (err) {
      console.error('[adminDashboard] Error rendering dashboard:', err);
      await ctx.reply('⚠️ Error loading admin dashboard.');
    }
  });

  // 2. Return to Dashboard callback: admin_dashboard
  bot.action('admin_dashboard', adminAuthMiddleware, async (ctx) => {
    try {
      const text = await renderAdminDashboardText();
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...getAdminDashboardKeyboard(),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('[adminDashboard] Error returning to dashboard:', err);
    }
  });

  // 3. Main Users page callback: admin_users or admin_users_page_<page>
  bot.action(/^admin_users(?:_page_(\d+))?$/, adminAuthMiddleware, async (ctx) => {
    try {
      const pageStr = ctx.match[1];
      const page = pageStr ? parseInt(pageStr, 10) : 1;
      const { text, page: currPage, totalPages, users } = await renderUsersPageText(page);

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...getUsersPageKeyboard(currPage, totalPages, users),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('[adminUsers] Error rendering users page:', err);
    }
  });

  // 4. User Timeline Callbacks: admin_user_timeline_<userId> or admin_timeline_page_<userId>_<page>
  bot.action(/^admin_user_timeline_(.+)$/, adminAuthMiddleware, async (ctx) => {
    try {
      const userId = ctx.match[1];
      const { text, page, totalPages, userExists } = await renderUserTimelineText(userId, 1);

      if (!userExists) {
        await ctx.answerCbQuery('⚠️ User not found', { show_alert: true });
        return;
      }

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...getUserTimelineKeyboard(userId, page, totalPages),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('[adminTimeline] Error rendering timeline:', err);
    }
  });

  bot.action(/^admin_timeline_page_(.+)_(\d+)$/, adminAuthMiddleware, async (ctx) => {
    try {
      const userId = ctx.match[1];
      const page = parseInt(ctx.match[2], 10);
      const { text, page: currPage, totalPages, userExists } = await renderUserTimelineText(userId, page);

      if (!userExists) {
        await ctx.answerCbQuery('⚠️ User not found', { show_alert: true });
        return;
      }

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...getUserTimelineKeyboard(userId, currPage, totalPages),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('[adminTimeline] Error rendering timeline page:', err);
    }
  });

  // 5. Individual User Profile callback: admin_user_<userId>
  bot.action(/^admin_user_(.+)$/, adminAuthMiddleware, async (ctx) => {
    try {
      const userId = ctx.match[1];
      const profileText = await renderUserProfileText(userId);

      if (!profileText) {
        await ctx.answerCbQuery('⚠️ User not found', { show_alert: true });
        return;
      }

      await ctx.editMessageText(profileText, {
        parse_mode: 'HTML',
        ...getUserProfileKeyboard(userId),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('[adminUserProfile] Error rendering user profile:', err);
    }
  });

  // 6. Placeholder for other admin_* callbacks
  bot.action(/^admin_(.+)$/, adminAuthMiddleware, async (ctx) => {
    try {
      await ctx.answerCbQuery(ADMIN_PLACEHOLDER_MESSAGE, { show_alert: true });
    } catch (err) {
      console.error('[adminDashboard] Error answering placeholder callback:', err);
    }
  });
}
