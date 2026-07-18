import { bot } from './bot';
import { startServer } from './server';

/**
 * Entry point — starts both the Telegraf long-polling bot and the Express
 * HTTP server in the same process.
 *
 * Handles startup error logging and graceful shutdown on SIGINT/SIGTERM.
 */
console.log('[bot] Starting Telegram bot...');

// Start the HTTP notify server (runs independently alongside polling)
startServer();

bot.launch()
  .then(() => {
    console.log('[bot] Telegram bot launched successfully (long-polling)');
  })
  .catch((err) => {
    console.error('[bot] Failed to launch Telegram bot:', err);
    process.exit(1);
  });

process.once('SIGINT', () => {
  console.log('[bot] SIGINT received. Shutting down bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('[bot] SIGTERM received. Shutting down bot...');
  bot.stop('SIGTERM');
});
