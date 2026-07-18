import { bot } from '../bot';
import { env } from '../config/env';
import { NotifyOptions } from '../types';

/**
 * Sends a structured, Markdown-formatted notification to the configured administrator.
 * Failures are caught and logged so that notifications do not interrupt execution.
 */
export async function notifyAdmin(options: NotifyOptions): Promise<void> {
  const { type, title, details } = options;

  // Determine the category emoji
  let emoji = 'ℹ️';
  switch (type) {
    case 'contact_form':
      emoji = '📩';
      break;
    case 'deploy':
      emoji = '🚀';
      break;
    case 'server_error':
      emoji = '🔥';
      break;
    case 'website_event':
      emoji = 'ℹ️';
      break;
  }

  // Map common field keys to user-friendly display labels
  const LABEL_MAP: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    telegramUsername: 'Telegram',
    telegram_username: 'Telegram',
    phone: 'Phone',
    message: 'Message',
  };

  // Build the markdown message
  let message = `${emoji} *${title}*\n\n`;
  
  // Format key-value pairs
  for (const [key, value] of Object.entries(details)) {
    const label = LABEL_MAP[key] ?? key
      .replace(/([_*\[`])/g, '\\$1')
      .replace(/\b([a-z])/, (match) => match.toUpperCase());
    const escapedValue = String(value).replace(/([_*\[`])/g, '\\$1');
    message += `*${label}:* ${escapedValue}\n`;
  }
  
  const tashkentTime = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  message += `\n_Vaqt:_ ${tashkentTime}`;

  try {
    await bot.telegram.sendMessage(env.ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
    });
    console.log(`[notifier] Admin notification sent successfully of type: ${type}`);
  } catch (error) {
    console.error(`[notifier] Failed to send admin notification of type: ${type}`, error);
  }
}
