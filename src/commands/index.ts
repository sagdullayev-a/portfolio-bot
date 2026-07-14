import { Telegraf, Context } from 'telegraf';
import { registerStartCommand } from './start';
import { registerAboutMeCommand } from './aboutMe';
import { registerSagdullayevUzCommand } from './sagdullayevuz';
import { registerWhoAmICommand } from './whoami'; // Temporary debug command

/**
 * Registers all user-facing bot commands.
 *
 * NOTE: This is the ONLY place that needs to change when a new command is added later.
 * 1. Create a new command file in src/commands/.
 * 2. Import it here and call its register function inside registerCommands.
 */
export function registerCommands(bot: Telegraf<Context>) {
  registerStartCommand(bot);
  registerAboutMeCommand(bot);
  registerSagdullayevUzCommand(bot);
  registerWhoAmICommand(bot); // Temporary debug command
}
