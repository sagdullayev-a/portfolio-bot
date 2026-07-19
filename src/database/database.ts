import { User, ActivityLog } from './types';
import { readJson, writeJson, USERS_FILE, ACTIVITY_LOGS_FILE } from './helpers';

/**
 * Loads all users from users.json.
 * Returns an empty array if file reading or parsing fails.
 */
export async function loadUsers(): Promise<User[]> {
  return readJson<User[]>(USERS_FILE, []);
}

/**
 * Saves users array to users.json formatted with 2 spaces and UTF-8 encoding.
 */
export async function saveUsers(users: User[]): Promise<void> {
  await writeJson<User[]>(USERS_FILE, users);
}

/**
 * Loads all activity logs from activityLogs.json.
 * Returns an empty array if file reading or parsing fails.
 */
export async function loadActivityLogs(): Promise<ActivityLog[]> {
  return readJson<ActivityLog[]>(ACTIVITY_LOGS_FILE, []);
}

/**
 * Saves activity logs array to activityLogs.json formatted with 2 spaces and UTF-8 encoding.
 */
export async function saveActivityLogs(logs: ActivityLog[]): Promise<void> {
  await writeJson<ActivityLog[]>(ACTIVITY_LOGS_FILE, logs);
}
