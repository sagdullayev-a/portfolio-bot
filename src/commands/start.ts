import { Telegraf, Context } from 'telegraf';

/**
 * Registers the /start command which sends a welcome message in Uzbek.
 */
export function registerStartCommand(bot: Telegraf<Context>) {
  bot.command('start', async (ctx) => {
    const welcomeMessage = 
      `👋 Salom, ${ctx.from?.first_name || 'tashrif buyuruvchi'}!\n\n` +
      `Mening shaxsiy portfolio botimga xush kelibsiz.\n\n` +
      `Quyidagi buyruqlar orqali men haqimda ma'lumot olishingiz mumkin:\n` +
      `👤 /about_me — Men haqimda\n` +
      `🌐 /cv_website — Mening rezyume va portfolio veb-saytim`;
      
    await ctx.reply(welcomeMessage);
  });
}
