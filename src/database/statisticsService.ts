import { ActionType } from './types';
import {
  getAllUsers,
  getUsersRegisteredToday,
  getUsersRegisteredThisWeek,
  getUsersRegisteredThisMonth,
  getActiveUsersToday as queryActiveUsersToday,
  getPremiumUsers,
  getAllLogs,
  getLogsToday,
} from './queryService';

export interface OverviewStatistics {
  totalUsers: number;
  activeUsersToday: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  totalMessages: number;
  totalCommands: number;
  totalAIRequests: number;
  totalLogs: number;
}

export interface DailyStatistics {
  messagesToday: number;
  commandsToday: number;
  aiToday: number;
  newUsersToday: number;
  activeUsersToday: number;
  logsToday: number;
}

export type ActionStatistics = Record<ActionType, number>;
export type LanguageStatistics = Record<string, number>;

/**
 * Returns total count of registered users.
 */
export async function getTotalUsers(): Promise<number> {
  const users = await getAllUsers();
  return users.length;
}

/**
 * Returns count of users active today.
 */
export async function getActiveUsersTodayCount(): Promise<number> {
  const activeUsers = await queryActiveUsersToday();
  return activeUsers.length;
}

/**
 * Alias for getActiveUsersTodayCount matching public API.
 */
export const getActiveUsersToday = getActiveUsersTodayCount;

/**
 * Returns count of users registered today.
 */
export async function getNewUsersToday(): Promise<number> {
  const newUsers = await getUsersRegisteredToday();
  return newUsers.length;
}

/**
 * Returns count of users registered within the last 7 days.
 */
export async function getNewUsersThisWeek(): Promise<number> {
  const newUsers = await getUsersRegisteredThisWeek();
  return newUsers.length;
}

/**
 * Returns count of users registered within the current month.
 */
export async function getNewUsersThisMonth(): Promise<number> {
  const newUsers = await getUsersRegisteredThisMonth();
  return newUsers.length;
}

/**
 * Returns count of premium users.
 */
export async function getPremiumUsersCount(): Promise<number> {
  const premiumUsers = await getPremiumUsers();
  return premiumUsers.length;
}

/**
 * Returns cumulative total of all messages sent by all users.
 */
export async function getTotalMessages(): Promise<number> {
  const users = await getAllUsers();
  return users.reduce((sum, u) => sum + (u.messageCount || 0), 0);
}

/**
 * Returns cumulative total of all commands executed by all users.
 */
export async function getTotalCommands(): Promise<number> {
  const users = await getAllUsers();
  return users.reduce((sum, u) => sum + (u.commandCount || 0), 0);
}

/**
 * Returns cumulative total of all AI requests made by all users.
 */
export async function getTotalAIRequests(): Promise<number> {
  const users = await getAllUsers();
  return users.reduce((sum, u) => sum + (u.aiRequestCount || 0), 0);
}

/**
 * Returns total count of activity logs recorded.
 */
export async function getTotalLogs(): Promise<number> {
  const logs = await getAllLogs();
  return logs.length;
}

/**
 * Returns a high-level overview object of all key system statistics.
 */
export async function getOverview(): Promise<OverviewStatistics> {
  const [
    users,
    activeToday,
    newToday,
    newWeek,
    newMonth,
    premium,
    logs,
  ] = await Promise.all([
    getAllUsers(),
    queryActiveUsersToday(),
    getUsersRegisteredToday(),
    getUsersRegisteredThisWeek(),
    getUsersRegisteredThisMonth(),
    getPremiumUsers(),
    getAllLogs(),
  ]);

  const totalMessages = users.reduce((sum, u) => sum + (u.messageCount || 0), 0);
  const totalCommands = users.reduce((sum, u) => sum + (u.commandCount || 0), 0);
  const totalAIRequests = users.reduce((sum, u) => sum + (u.aiRequestCount || 0), 0);

  return {
    totalUsers: users.length,
    activeUsersToday: activeToday.length,
    newUsersToday: newToday.length,
    newUsersThisWeek: newWeek.length,
    newUsersThisMonth: newMonth.length,
    premiumUsers: premium.length,
    totalMessages,
    totalCommands,
    totalAIRequests,
    totalLogs: logs.length,
  };
}

/**
 * Returns distribution count per ActionType recorded in activity logs.
 */
export async function getActionStatistics(): Promise<ActionStatistics> {
  const logs = await getAllLogs();

  const stats: ActionStatistics = {
    START: 0,
    COMMAND: 0,
    AI_CHAT: 0,
    TEXT: 0,
    PHOTO: 0,
    VOICE: 0,
    VIDEO: 0,
    DOCUMENT: 0,
    STICKER: 0,
    CONTACT: 0,
    LOCATION: 0,
    CALLBACK: 0,
    ERROR: 0,
    UNAUTHORIZED: 0,
  };

  for (const log of logs) {
    if (log.action && stats[log.action] !== undefined) {
      stats[log.action] += 1;
    }
  }

  return stats;
}

/**
 * Returns user count distribution per languageCode.
 */
export async function getLanguageStatistics(): Promise<LanguageStatistics> {
  const users = await getAllUsers();
  const stats: LanguageStatistics = {};

  for (const user of users) {
    const lang = user.languageCode ? user.languageCode.toLowerCase() : 'unknown';
    stats[lang] = (stats[lang] || 0) + 1;
  }

  return stats;
}

/**
 * Returns today's real-time statistics breakdown.
 */
export async function getDailyStatistics(): Promise<DailyStatistics> {
  const [logsToday, newUsersToday, activeUsersToday] = await Promise.all([
    getLogsToday(),
    getUsersRegisteredToday(),
    queryActiveUsersToday(),
  ]);

  let messagesToday = 0;
  let commandsToday = 0;
  let aiToday = 0;

  for (const log of logsToday) {
    if (
      log.action === 'TEXT' ||
      log.action === 'PHOTO' ||
      log.action === 'VOICE' ||
      log.action === 'DOCUMENT'
    ) {
      messagesToday += 1;
    } else if (log.action === 'COMMAND' || log.action === 'START') {
      commandsToday += 1;
    } else if (log.action === 'AI_CHAT') {
      aiToday += 1;
    }
  }

  return {
    messagesToday,
    commandsToday,
    aiToday,
    newUsersToday: newUsersToday.length,
    activeUsersToday: activeUsersToday.length,
    logsToday: logsToday.length,
  };
}
