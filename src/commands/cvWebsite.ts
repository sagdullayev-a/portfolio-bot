import { Telegraf, Context } from 'telegraf';
import { env } from '../config/env';

/**
 * Registers the /cv_website command which sends the portfolio website URL.
 */
export function registerCvWebsiteCommand(bot: Telegraf<Context>) {
  bot.command('cv_website', async (ctx) => {
    const websiteMessage = 
      `🌐 *CV & Portfolio Website*\n\n` +
      `You can check out my CV and full project showcase here:\n` +
      `👉 ${env.PORTFOLIO_WEBSITE_URL}`;
      
    await ctx.reply(websiteMessage, { parse_mode: 'Markdown' });
  });
}
