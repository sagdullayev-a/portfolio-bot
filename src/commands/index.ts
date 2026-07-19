import { Telegraf, Context } from 'telegraf';
import { registerStartCommand } from './start';
import { registerAboutMeCommand } from './aboutMe';
import { registerSagdullayevUzCommand } from './sagdullayevuz';
import { registerWhoAmICommand } from './whoami'; // Temporary debug command
import { registerAdminDashboardCommand } from './adminDashboard';

/**
 * Registers all user-facing and admin bot commands.
 */
export function registerCommands(bot: Telegraf<Context>) {
  registerStartCommand(bot);
  registerAboutMeCommand(bot);
  registerSagdullayevUzCommand(bot);
  registerWhoAmICommand(bot); // Temporary debug command
  registerAdminDashboardCommand(bot);
}
