import { Context, MiddlewareFn } from 'telegraf';
import { isAdmin } from '../config/admin';
import { createLog } from '../database';

export const UNAUTHORIZED_MESSAGE = "⛔ Sizda ushbu buyruqdan foydalanish huquqi yo'q.";

/**
 * Telegraf middleware that protects admin handlers.
 * Blocks non-admin users, logs the unauthorized attempt, and sends a rejection message.
 */
export const adminAuthMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const telegramId = ctx.from?.id;

  if (!isAdmin(telegramId)) {
    if (telegramId) {
      const attemptDetails = (ctx.message as Record<string, any>)?.text || (ctx.callbackQuery as Record<string, any>)?.data || 'unauthorized_action';
      try {
        await createLog({
          telegramId,
          action: 'UNAUTHORIZED',
          message: `Attempted command/action: ${attemptDetails}`,
          chatId: ctx.chat?.id,
          chatType: ctx.chat?.type,
        });
      } catch (err) {
        console.error('[adminAuthMiddleware] Failed to log unauthorized attempt:', err);
      }
    }

    try {
      await ctx.reply(UNAUTHORIZED_MESSAGE);
    } catch (err) {
      console.error('[adminAuthMiddleware] Failed to send unauthorized reply:', err);
    }

    // Do NOT call next() -> halt execution pipeline
    return;
  }

  return next();
};

/**
 * Helper function matching public requireAdmin requirement.
 */
export const requireAdmin = adminAuthMiddleware;
