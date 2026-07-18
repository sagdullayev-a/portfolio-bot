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
  BOT_TOKEN: required('TELEGRAM_BOT_TOKEN'),
  ADMIN_CHAT_ID: required('TELEGRAM_ADMIN_CHAT_ID'),
  PORTFOLIO_WEBSITE_URL: required('PORTFOLIO_WEBSITE_URL'),
  NODE_ENV: required('NODE_ENV'),
  GEMINI_API_KEY: optional('GEMINI_API_KEY', ''),
} as const;