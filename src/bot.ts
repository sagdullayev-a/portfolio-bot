import { Telegraf } from 'telegraf';
import { env } from './config/env';
import { loggerMiddleware } from './middlewares/logger';
import { registerCommands } from './commands';

/**
 * Central Telegraf instance for the bot service.
 *
 * Middleware, command registration, and the global error handler
 * are wired here in Phase 2.
 */
export const bot = new Telegraf(env.BOT_TOKEN);

// 1. Wire logging middleware
bot.use(loggerMiddleware);

// 2. Register commands
registerCommands(bot);

// 3. Global error handler
bot.catch((err, ctx) => {
  console.error(`[bot] Global error occurred for update: ${ctx.updateType}`, err);
  // Fail gracefully without crashing the whole process
});
