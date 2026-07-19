import { Context, MiddlewareFn } from 'telegraf';
import {
  logStart,
  logCommand,
  logText,
  logPhoto,
  logVoice,
  logDocument,
  logLocation,
  logContact,
  logCallback,
  createLog,
} from '../database';

/**
 * Telegraf middleware that inspects every incoming update and records
 * user activity into activityLogs.json safely without interrupting execution.
 */
export const activityLoggerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (ctx.from) {
    const telegramId = ctx.from.id;
    const chatId = ctx.chat?.id;
    const chatType = ctx.chat?.type;

    try {
      if (ctx.callbackQuery) {
        const callbackData = (ctx.callbackQuery as { data?: string }).data || '';
        await logCallback({
          telegramId,
          chatId,
          chatType,
          message: callbackData,
        });
      } else if (ctx.message) {
        const msg = ctx.message as Record<string, any>;
        const messageId = msg.message_id;

        if (msg.text) {
          const text: string = msg.text;
          if (text.startsWith('/start')) {
            await logStart({ telegramId, chatId, chatType, messageId, message: text });
          } else if (text.startsWith('/')) {
            await logCommand({ telegramId, chatId, chatType, messageId, message: text });
          } else {
            await logText({ telegramId, chatId, chatType, messageId, message: text });
          }
        } else if (msg.photo) {
          await logPhoto({ telegramId, chatId, chatType, messageId, message: msg.caption ?? '' });
        } else if (msg.voice) {
          await logVoice({ telegramId, chatId, chatType, messageId, message: msg.caption ?? '' });
        } else if (msg.video) {
          await createLog({ telegramId, action: 'VIDEO', chatId, chatType, messageId, message: msg.caption ?? '' });
        } else if (msg.document) {
          await logDocument({ telegramId, chatId, chatType, messageId, message: msg.caption ?? '' });
        } else if (msg.sticker) {
          await createLog({ telegramId, action: 'STICKER', chatId, chatType, messageId, message: msg.sticker?.emoji ?? '' });
        } else if (msg.location) {
          await logLocation({ telegramId, chatId, chatType, messageId });
        } else if (msg.contact) {
          await logContact({ telegramId, chatId, chatType, messageId });
        }
      }
    } catch (err) {
      console.error('[activityLoggerMiddleware] Failed to log activity:', err);
    }
  }

  return next();
};
