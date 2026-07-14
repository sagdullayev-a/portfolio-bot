import { Telegraf, Context } from 'telegraf';

/**
 * Registers the /about_me command which sends a short bio placeholder paragraph.
 */
export function registerAboutMeCommand(bot: Telegraf<Context>) {
  bot.command('about_me', async (ctx) => {
    const bioMessage = 
      `👤 *About Me*\n\n` +
      `I am a passionate Full-Stack Software Engineer with experience in building ` +
      `modern, interactive web applications using React, Next.js, Node.js, and TypeScript.\n\n` +
      `I love solving complex problems, writing clean and maintainable code, and designing ` +
      `premium user experiences. Always looking for new learning opportunities and collaborations! 🚀`;
      
    await ctx.reply(bioMessage, { parse_mode: 'Markdown' });
  });
}
