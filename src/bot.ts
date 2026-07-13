import { Telegraf } from 'telegraf';
import { env } from './config/env';

/**
 * Central Telegraf instance for the bot service.
 *
 * Phase 1: only constructs the bot from the validated token.
 * Command registration, middleware and the global error handler are
 * wired in during Phase 2 — do not add them here yet.
 */
export const bot = new Telegraf(env.BOT_TOKEN);
