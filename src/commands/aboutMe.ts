import { Telegraf, Context } from 'telegraf';

/**
 * Registers the /about_me command which sends the biography in Uzbek.
 */
export function registerAboutMeCommand(bot: Telegraf<Context>) {
  bot.command('about_me', async (ctx) => {
    const bioMessage = 
      `👤 *Men Haqimda*\n\n` +
      `Men zamonaviy, tezkor va interaktiv veb-ilovalarni yaratishga ishtiyoqi baland bo'lgan ` +
      `Full-Stack dasturchiman. React, Next.js, Node.js va TypeScript yordamida sifatli, ` +
      `foydalanuvchiga qulay va premium ko'rinishdagi raqamli mahsulotlarni ishlab chiqaman. ` +
      `Doimo yangi bilimlar olish va qiziqarli loyihalar ustida hamkorlik qilishga tayyorman! 🚀`;
      
    await ctx.reply(bioMessage, { parse_mode: 'Markdown' });
  });
}
