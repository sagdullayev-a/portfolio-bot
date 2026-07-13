import { bot } from './bot';

/**
 * Entry point — starts the bot in long-polling mode.
 *
 * Kept intentionally minimal during Phase 1 (command/middleware wiring lands
 * in Phase 2 and lives in bot.ts, not here). Graceful shutdown is handled so
 * the process exits cleanly on deploy platforms (SIGTERM) and Ctrl-C (SIGINT).
 */
bot.launch();
console.log('[bot] telegram bot launched (long-polling)');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
