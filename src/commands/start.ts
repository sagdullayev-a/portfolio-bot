import { Telegraf, Context } from 'telegraf';

/**
 * Registers the /start command which sends a welcome message and lists
 * available bot commands.
 */
export function registerStartCommand(bot: Telegraf<Context>) {
  bot.command('start', async (ctx) => {
    const welcomeMessage = 
      `👋 Hello, ${ctx.from?.first_name || 'there'}!\n\n` +
      `Welcome to my portfolio bot. I am Prince, a Full-Stack Developer.\n\n` +
      `Here are the commands you can use to learn more about me:\n` +
      `👤 /about_me — Learn more about my background and skills\n` +
      `🌐 /cv_website — Get the link to my CV and portfolio website`;
      
    await ctx.reply(welcomeMessage);
  });
}
