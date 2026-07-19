import { bot } from '../bot';
import { env } from '../config/env';
import { NotifyOptions } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends a structured notification to the configured administrator.
 * Contact form notifications are formatted in Uzbek with exact required layout.
 */
export async function notifyAdmin(options: NotifyOptions): Promise<void> {
  const { type, title, details } = options;

  if (type === 'contact_form') {
    const name = details.name || 'Kiritilmagan';
    const email = details.email || 'Kiritilmagan';
    const rawTg = details.telegramUsername || details.telegram || '';
    const telegram = rawTg ? (rawTg.startsWith('@') ? rawTg : `@${rawTg}`) : 'Kiritilmagan';
    const phone = details.phone || 'Kiritilmagan';
    const messageContent = details.message || '';

    const tashkentTime = new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const formattedMessage = `📩 <b>Yangi xabar keldi</b>

👤 <b>Ismi:</b>
${escapeHtml(name)}

📧 <b>Email:</b>
${escapeHtml(email)}

💬 <b>Telegram:</b>
${escapeHtml(telegram)}

📱 <b>Telefon:</b>
${escapeHtml(phone)}

📝 <b>Xabar:</b>
${escapeHtml(messageContent)}

🕒 <b>Yuborilgan vaqt:</b>
${tashkentTime}`;

    try {
      await bot.telegram.sendMessage(env.ADMIN_CHAT_ID, formattedMessage, {
        parse_mode: 'HTML',
      });
      console.log(`[notifier] Admin notification sent successfully of type: ${type}`);
    } catch (error) {
      console.error(`[notifier] Failed to send admin notification of type: ${type}`, error);
    }
    return;
  }

  // Fallback for other notification types (deploy, server_error, website_event)
  let emoji = 'ℹ️';
  switch (type) {
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

  const LABEL_MAP: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    telegramUsername: 'Telegram',
    telegram_username: 'Telegram',
    phone: 'Phone',
    message: 'Message',
  };

  let messageText = `${emoji} *${title}*\n\n`;
  for (const [key, value] of Object.entries(details)) {
    const label = LABEL_MAP[key] ?? key
      .replace(/([_*\[`])/g, '\\$1')
      .replace(/\b([a-z])/, (match) => match.toUpperCase());
    const escapedValue = String(value).replace(/([_*\[`])/g, '\\$1');
    messageText += `*${label}:* ${escapedValue}\n`;
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

  messageText += `\n_Vaqt:_ ${tashkentTime}`;

  try {
    await bot.telegram.sendMessage(env.ADMIN_CHAT_ID, messageText, {
      parse_mode: 'Markdown',
    });
    console.log(`[notifier] Admin notification sent successfully of type: ${type}`);
  } catch (error) {
    console.error(`[notifier] Failed to send admin notification of type: ${type}`, error);
  }
}
