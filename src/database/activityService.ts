import crypto from 'crypto';
import { ActivityLog } from './types';
import { loadActivityLogs, saveActivityLogs } from './database';
import { findUserByTelegramId } from './userService';

export const MAX_LOGS = 50000;

export interface LogInput {
  telegramId: number;
  message?: string | null;
  messageId?: number;
  chatId?: number;
  chatType?: string;
  userId?: string;
}

// Mutex queue lock to ensure safe atomic file updates without race conditions
let logQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const result = logQueue.then(task, task);
  logQueue = result.catch(() => {});
  return result;
}

/**
 * Core log creation function.
 * Automatically resolves userId, assigns UUID and timestamp,
 * and maintains MAX_LOGS limit (trimming oldest logs when exceeded).
 */
export async function createLog(
  data: Omit<ActivityLog, 'id' | 'createdAt'> & { userId?: string }
): Promise<ActivityLog> {
  return withLock(async () => {
    let resolvedUserId = data.userId;

    if (!resolvedUserId) {
      const user = await findUserByTelegramId(data.telegramId);
      if (user) {
        resolvedUserId = user.id;
      }
    }

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      userId: resolvedUserId,
      telegramId: data.telegramId,
      action: data.action,
      message: data.message ?? null,
      messageId: data.messageId,
      chatId: data.chatId,
      chatType: data.chatType,
      createdAt: new Date().toISOString(),
    };

    let logs = await loadActivityLogs();
    logs.push(newLog);

    if (logs.length > MAX_LOGS) {
      logs = logs.slice(logs.length - MAX_LOGS);
    }

    await saveActivityLogs(logs);
    return newLog;
  });
}

export async function logStart(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'START' });
}

export async function logCommand(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'COMMAND' });
}

export async function logAI(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'AI_CHAT' });
}

export async function logText(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'TEXT' });
}

export async function logPhoto(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'PHOTO' });
}

export async function logVoice(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'VOICE' });
}

export async function logDocument(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'DOCUMENT' });
}

export async function logLocation(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'LOCATION' });
}

export async function logContact(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'CONTACT' });
}

export async function logCallback(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'CALLBACK' });
}

export async function logError(data: LogInput): Promise<ActivityLog> {
  return createLog({ ...data, action: 'ERROR' });
}
