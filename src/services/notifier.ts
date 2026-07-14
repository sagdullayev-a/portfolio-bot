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

  // Build the markdown message
  let message = `${emoji} *${title}*\n\n`;
  
  // Format key-value pairs
  for (const [key, value] of Object.entries(details)) {
    const formattedKey = key
      .replace(/([_*\[`])/g, '\\$1') // simple escape for key names
      .replace(/\b([a-z])/, (match) => match.toUpperCase()); // capitalize key
    message += `*${formattedKey}:* ${value}\n`;
  }
  
  message += `\n_Vaqt (UTC):_ ${new Date().toISOString()}`;

  try {
    await bot.telegram.sendMessage(env.ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
    });
    console.log(`[notifier] Admin notification sent successfully of type: ${type}`);
  } catch (error) {
    console.error(`[notifier] Failed to send admin notification of type: ${type}`, error);
  }
}
