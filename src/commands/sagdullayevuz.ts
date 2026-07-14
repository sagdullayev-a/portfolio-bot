import { Telegraf, Context } from 'telegraf';
import { env } from '../config/env';

/**
 * Registers the /sagdullayevuz command which sends the portfolio URL in Uzbek.
 */
export function registerSagdullayevUzCommand(bot: Telegraf<Context>) {
  bot.command('sagdullayevuz', async (ctx) => {
    const websiteMessage = 
      `🌐 *Rezyume va Portfolio Veb-saytim*\n\n` +
      `Mening to'liq rezyumem va bajargan loyihalarim bilan quyidagi havola orqali tanishishingiz mumkin:\n` +
      `👉 ${env.PORTFOLIO_WEBSITE_URL}`;
      
    await ctx.reply(websiteMessage, { parse_mode: 'Markdown' });
  });
}
