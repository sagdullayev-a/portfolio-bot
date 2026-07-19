import { User, ActivityLog, ActionType } from './types';
import { loadUsers, loadActivityLogs } from './database';

// ── DATE & UTILITY HELPERS ───────────────────────────────────────────────────

function isSameDay(dateStr?: string | null, targetDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
}

function isSameMonth(dateStr?: string | null, targetDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth()
  );
}

function isWithinDays(dateStr?: string | null, days: number = 7): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return false;
  const now = new Date().getTime();
  const diffDays = (now - d) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

function sortUsersDesc(users: User[]): User[] {
  return [...users].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.registeredAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.registeredAt || 0).getTime();
    return timeB - timeA;
  });
}

function sortLogsDesc(logs: ActivityLog[]): ActivityLog[] {
  return [...logs].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

// ── USER QUERIES ─────────────────────────────────────────────────────────────

/**
 * Retrieves all users sorted by creation date descending.
 */
export async function getAllUsers(): Promise<User[]> {
  const users = await loadUsers();
  return sortUsersDesc(users);
}

/**
 * Retrieves a user by their unique UUID.
 */
export async function getUserById(id: string): Promise<User | null> {
  const users = await loadUsers();
  const found = users.find((u) => u.id === id);
  return found ? { ...found } : null;
}

/**
 * Retrieves a user by their Telegram ID.
 */
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const users = await loadUsers();
  const found = users.find((u) => u.telegramId === telegramId);
  return found ? { ...found } : null;
}

/**
 * Retrieves a user by their Telegram username (case-insensitive).
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  if (!username) return null;
  const cleanUsername = username.replace(/^@+/, '').toLowerCase();
  const users = await loadUsers();
  const found = users.find((u) => u.username && u.username.toLowerCase() === cleanUsername);
  return found ? { ...found } : null;
}

/**
 * Retrieves users who registered today.
 */
export async function getUsersRegisteredToday(): Promise<User[]> {
  const users = await loadUsers();
  const todayUsers = users.filter((u) => isSameDay(u.registeredAt || u.createdAt));
  return sortUsersDesc(todayUsers);
}

/**
 * Retrieves users who registered within the last 7 days.
 */
export async function getUsersRegisteredThisWeek(): Promise<User[]> {
  const users = await loadUsers();
  const weekUsers = users.filter((u) => isWithinDays(u.registeredAt || u.createdAt, 7));
  return sortUsersDesc(weekUsers);
}

/**
 * Retrieves users who registered during the current month.
 */
export async function getUsersRegisteredThisMonth(): Promise<User[]> {
  const users = await loadUsers();
  const monthUsers = users.filter((u) => isSameMonth(u.registeredAt || u.createdAt));
  return sortUsersDesc(monthUsers);
}

/**
 * Retrieves users who were active today.
 */
export async function getActiveUsersToday(): Promise<User[]> {
  const users = await loadUsers();
  const activeUsers = users.filter((u) => isSameDay(u.lastActive));
  return sortUsersDesc(activeUsers);
}

/**
 * Retrieves top users sorted by messageCount descending.
 */
export async function getTopActiveUsers(limit: number = 10): Promise<User[]> {
  const users = await loadUsers();
  const sorted = [...users].sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
  return sorted.slice(0, limit);
}

/**
 * Retrieves all premium users sorted by creation date descending.
 */
export async function getPremiumUsers(): Promise<User[]> {
  const users = await loadUsers();
  const premiumUsers = users.filter((u) => Boolean(u.isPremium));
  return sortUsersDesc(premiumUsers);
}

// ── SEARCH QUERIES ───────────────────────────────────────────────────────────

/**
 * Searches users by keyword across Telegram ID, Username, First Name, and Last Name.
 * Case-insensitive, returns users sorted by creation date descending.
 */
export async function searchUsers(keyword: string): Promise<User[]> {
  if (!keyword || !keyword.trim()) return [];
  const cleanKeyword = keyword.trim().toLowerCase().replace(/^@+/, '');
  const users = await loadUsers();

  const matched = users.filter((u) => {
    const tgIdStr = String(u.telegramId);
    const username = (u.username || '').toLowerCase();
    const firstName = (u.firstName || '').toLowerCase();
    const lastName = (u.lastName || '').toLowerCase();

    return (
      tgIdStr.includes(cleanKeyword) ||
      username.includes(cleanKeyword) ||
      firstName.includes(cleanKeyword) ||
      lastName.includes(cleanKeyword)
    );
  });

  return sortUsersDesc(matched);
}

// ── ACTIVITY QUERIES ─────────────────────────────────────────────────────────

/**
 * Retrieves all activity logs sorted by creation date descending.
 */
export async function getAllLogs(): Promise<ActivityLog[]> {
  const logs = await loadActivityLogs();
  return sortLogsDesc(logs);
}

/**
 * Retrieves recent N activity logs sorted by creation date descending.
 */
export async function getRecentLogs(limit: number = 20): Promise<ActivityLog[]> {
  const logs = await loadActivityLogs();
  const sorted = sortLogsDesc(logs);
  return sorted.slice(0, limit);
}

/**
 * Retrieves activity logs for a specific internal User UUID sorted descending.
 */
export async function getLogsByUser(userId: string): Promise<ActivityLog[]> {
  if (!userId) return [];
  const logs = await loadActivityLogs();
  const userLogs = logs.filter((l) => l.userId === userId);
  return sortLogsDesc(userLogs);
}

/**
 * Retrieves activity logs for a specific Telegram ID sorted descending.
 */
export async function getLogsByTelegramId(telegramId: number): Promise<ActivityLog[]> {
  const logs = await loadActivityLogs();
  const tgLogs = logs.filter((l) => l.telegramId === telegramId);
  return sortLogsDesc(tgLogs);
}

/**
 * Retrieves activity logs matching a specific ActionType sorted descending.
 */
export async function getLogsByAction(action: ActionType): Promise<ActivityLog[]> {
  const logs = await loadActivityLogs();
  const actionLogs = logs.filter((l) => l.action === action);
  return sortLogsDesc(actionLogs);
}

/**
 * Retrieves activity logs recorded today sorted descending.
 */
export async function getLogsToday(): Promise<ActivityLog[]> {
  const logs = await loadActivityLogs();
  const todayLogs = logs.filter((l) => isSameDay(l.createdAt));
  return sortLogsDesc(todayLogs);
}

/**
 * Retrieves activity logs created between startDate and endDate.
 */
export async function getLogsBetweenDates(
  startDate: Date | string,
  endDate: Date | string
): Promise<ActivityLog[]> {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  if (isNaN(startMs) || isNaN(endMs)) return [];

  const minMs = Math.min(startMs, endMs);
  const maxMs = Math.max(startMs, endMs);

  const logs = await loadActivityLogs();
  const rangeLogs = logs.filter((l) => {
    const time = new Date(l.createdAt).getTime();
    return time >= minMs && time <= maxMs;
  });

  return sortLogsDesc(rangeLogs);
}

/**
 * Retrieves the single most recent activity log for a specific internal User UUID.
 */
export async function getLatestUserActivity(userId: string): Promise<ActivityLog | null> {
  const logs = await getLogsByUser(userId);
  return logs.length > 0 ? logs[0] : null;
}
