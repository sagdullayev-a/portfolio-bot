import 'dotenv/config';

/**
 * Loads and validates environment variables at startup.
 * Throws a clear error if any required variable is missing so the process
 * fails fast with an actionable message instead of a cryptic runtime crash.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env and fill in the value.`,
    );
  }
  return value.trim();
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

export const env = {
  /** Telegram bot token issued by @BotFather. */
  BOT_TOKEN: required('TELEGRAM_BOT_TOKEN'),
  /** Admin chat id that receives private notifications. */
  ADMIN_CHAT_ID: required('TELEGRAM_ADMIN_CHAT_ID'),
  /** Runtime mode. */
  NODE_ENV: optional('NODE_ENV', 'development'),
} as const;
