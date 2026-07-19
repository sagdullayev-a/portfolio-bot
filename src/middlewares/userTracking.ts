import { Context, MiddlewareFn } from 'telegraf';
import { syncUser } from '../database';

/**
 * Telegraf middleware that automatically synchronizes the user with users.json
 * on every incoming update without interrupting the handler pipeline.
 */
export const userTrackingMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (ctx.from) {
    const telegramId = ctx.from.id;
    const chatId = ctx.chat?.id ?? telegramId;
    const chatType = ctx.chat?.type ?? 'private';

    try {
      await syncUser({
        telegramId,
        chatId,
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        lastName: ctx.from.last_name ?? null,
        languageCode: ctx.from.language_code ?? null,
        isPremium: Boolean(ctx.from.is_premium),
        isBot: Boolean(ctx.from.is_bot),
        addedToAttachmentMenu: Boolean(ctx.from.added_to_attachment_menu),
        chatType,
      });
    } catch (err) {
      console.error('[userTrackingMiddleware] Failed to sync user:', err);
    }
  }

  return next();
};
