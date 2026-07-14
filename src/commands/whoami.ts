import { Telegraf, Context } from 'telegraf';

/**
 * Registers the temporary /whoami command to return the user's Telegram Chat ID.
 *
 * WARNING: This is a temporary debug command. Remove it before production.
 */
export function registerWhoAmICommand(bot: Telegraf<Context>) {
  bot.command('whoami', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId !== undefined) {
      await ctx.reply(`🔍 Your Telegram Chat ID is: \`${chatId}\``, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('❌ Could not retrieve chat ID.');
    }
  });
}
