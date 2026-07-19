import { env } from './env';

const initialAdminId = Number(env.ADMIN_CHAT_ID);

/**
 * Array of administrator Telegram IDs.
 */
export const ADMIN_IDS: readonly number[] = [
  ...(isNaN(initialAdminId) ? [] : [initialAdminId]),
];

// O(1) Set lookup storage for admin Telegram IDs
const adminIdSet = new Set<number>(ADMIN_IDS);

/**
 * Checks if a given Telegram ID is an administrator with O(1) complexity.
 */
export function isAdmin(telegramId?: number | string | null): boolean {
  if (telegramId === undefined || telegramId === null) return false;
  const numericId = typeof telegramId === 'string' ? Number(telegramId) : telegramId;
  if (isNaN(numericId)) return false;
  return adminIdSet.has(numericId);
}

/**
 * Returns an array of all registered administrator Telegram IDs.
 */
export function getAdminIds(): number[] {
  return Array.from(adminIdSet);
}

/**
 * Dynamically registers a new administrator Telegram ID.
 */
export function addAdminId(telegramId: number): void {
  if (typeof telegramId === 'number' && !isNaN(telegramId)) {
    adminIdSet.add(telegramId);
  }
}
