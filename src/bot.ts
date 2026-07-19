import { Telegraf } from 'telegraf';
import { env } from './config/env';
import { loggerMiddleware } from './middlewares/logger';
import { userTrackingMiddleware } from './middlewares/userTracking';
import { registerCommands } from './commands';

/**
 * Central Telegraf instance for the bot service.
 * Wire logging, user tracking middleware, command registration, and global error handling.
 */
export const bot = new Telegraf(env.BOT_TOKEN);

// 1. Wire logging & user tracking middlewares
bot.use(loggerMiddleware);
bot.use(userTrackingMiddleware);

// 2. Register commands
registerCommands(bot);

// 3. Global error handler
bot.catch((err, ctx) => {
  console.error(`[bot] Global error occurred for update: ${ctx.updateType}`, err);
  // Fail gracefully without crashing the whole process
});
