import fs from 'fs/promises';
import path from 'path';

export const DATABASE_DIR = __dirname;
export const USERS_FILE = path.join(DATABASE_DIR, 'users.json');
export const ACTIVITY_LOGS_FILE = path.join(DATABASE_DIR, 'activityLogs.json');

/**
 * Ensures that a file exists. If it does not, creates it with defaultContent.
 */
async function ensureFileExists(filePath: string, defaultContent: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, defaultContent, 'utf-8');
  }
}

/**
 * Ensures the database directory and required JSON files exist.
 */
export async function ensureDatabaseExists(): Promise<void> {
  try {
    await fs.mkdir(DATABASE_DIR, { recursive: true });
    await ensureFileExists(USERS_FILE, '[]');
    await ensureFileExists(ACTIVITY_LOGS_FILE, '[]');
  } catch (error) {
    console.error('[database] Error ensuring database directory/files exist:', error);
  }
}

/**
 * Safely reads and parses a JSON file.
 * Returns the fallback value if the file is missing, empty, or corrupted.
 */
export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await ensureDatabaseExists();
    const rawData = await fs.readFile(filePath, 'utf-8');
    if (!rawData.trim()) {
      return fallback;
    }
    return JSON.parse(rawData) as T;
  } catch (error) {
    console.warn(`[database] Failed to read or parse JSON at ${filePath}. Returning fallback.`, error);
    return fallback;
  }
}

/**
 * Safely writes formatted JSON data to a file using UTF-8 encoding.
 */
export async function writeJson<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDatabaseExists();
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf-8');
  } catch (error) {
    console.error(`[database] Failed to write JSON to ${filePath}:`, error);
  }
}
