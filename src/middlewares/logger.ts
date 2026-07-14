import { Context, MiddlewareFn } from 'telegraf';

/**
 * Telegraf middleware that logs incoming updates (type, chat ID, sender, and text/command)
 * to the console for debugging and operational visibility.
 */
export const loggerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const start = Date.now();
  const updateType = ctx.updateType;
  const chatId = ctx.chat?.id || 'unknown';
  const username = ctx.from?.username || 'unknown';
  
  let content = '';
  if (ctx.message && 'text' in ctx.message) {
    content = ctx.message.text;
  } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    content = `[Callback] ${ctx.callbackQuery.data}`;
  } else {
    content = `[${updateType}]`;
  }
  
  console.log(`[bot-logger] --> Received ${updateType} from chat ID: ${chatId} (@${username}): "${content}"`);
  
  await next();
  
  const duration = Date.now() - start;
  console.log(`[bot-logger] <-- Handled in ${duration}ms`);
};
