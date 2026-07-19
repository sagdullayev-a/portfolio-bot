import crypto from 'crypto';
import { User } from './types';
import { loadUsers, saveUsers } from './database';

export interface UserSyncInput {
  telegramId: number;
  chatId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
  isBot?: boolean;
  addedToAttachmentMenu?: boolean;
  chatType?: string;
}

// Mutex queue lock to ensure safe atomic file updates without race conditions
let writeQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task, task);
  writeQueue = result.catch(() => {});
  return result;
}

/**
 * Finds a user by their Telegram ID.
 * Returns null if the user is not found.
 */
export async function findUserByTelegramId(telegramId: number): Promise<User | null> {
  const users = await loadUsers();
  const found = users.find((u) => u.telegramId === telegramId);
  return found ? { ...found } : null;
}

/**
 * Saves or replaces a user record in users.json.
 */
export async function saveUser(user: User): Promise<User> {
  return withLock(async () => {
    const users = await loadUsers();
    const index = users.findIndex((u) => u.telegramId === user.telegramId || u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    await saveUsers(users);
    return user;
  });
}

/**
 * Creates a new User record and persists it to users.json.
 */
export async function createUser(data: UserSyncInput): Promise<User> {
  const now = new Date().toISOString();
  const newUser: User = {
    id: crypto.randomUUID(),
    telegramId: data.telegramId,
    username: data.username ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    languageCode: data.languageCode ?? null,
    isPremium: data.isPremium ?? false,
    isBot: data.isBot ?? false,
    addedToAttachmentMenu: data.addedToAttachmentMenu ?? false,
    chatId: data.chatId,
    chatType: data.chatType ?? 'private',
    registeredAt: now,
    lastActive: now,
    messageCount: 1,
    commandCount: 0,
    aiRequestCount: 0,
    lastCommand: '',
    lastFunction: '',
    createdAt: now,
    updatedAt: now,
  };

  return saveUser(newUser);
}

/**
 * Updates an existing user record with fresh Telegram details.
 * Increments messageCount by 1 and updates lastActive / updatedAt timestamps.
 */
export async function updateUser(existingUser: User, data: UserSyncInput): Promise<User> {
  const now = new Date().toISOString();
  const updatedUser: User = {
    ...existingUser,
    username: data.username !== undefined ? data.username : existingUser.username,
    firstName: data.firstName !== undefined ? data.firstName : existingUser.firstName,
    lastName: data.lastName !== undefined ? data.lastName : existingUser.lastName,
    languageCode: data.languageCode !== undefined ? data.languageCode : existingUser.languageCode,
    isPremium: data.isPremium !== undefined ? data.isPremium : existingUser.isPremium,
    isBot: data.isBot !== undefined ? data.isBot : existingUser.isBot,
    addedToAttachmentMenu: data.addedToAttachmentMenu !== undefined ? data.addedToAttachmentMenu : existingUser.addedToAttachmentMenu,
    chatId: data.chatId !== undefined ? data.chatId : existingUser.chatId,
    chatType: data.chatType !== undefined ? data.chatType : existingUser.chatType,
    lastActive: now,
    updatedAt: now,
    messageCount: (existingUser.messageCount || 0) + 1,
  };

  return saveUser(updatedUser);
}

/**
 * Primary synchronization method.
 * Creates user if not present, otherwise updates existing user details.
 */
export async function syncUser(data: UserSyncInput): Promise<User> {
  const existingUser = await findUserByTelegramId(data.telegramId);
  if (!existingUser) {
    return createUser(data);
  }
  return updateUser(existingUser, data);
}

/**
 * Increments user's messageCount by 1.
 */
export async function incrementMessageCount(telegramId: number): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.messageCount = (user.messageCount || 0) + 1;
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}

/**
 * Increments user's commandCount by 1.
 */
export async function incrementCommandCount(telegramId: number): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.commandCount = (user.commandCount || 0) + 1;
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}

/**
 * Increments user's aiRequestCount by 1.
 */
export async function incrementAIRequestCount(telegramId: number): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.aiRequestCount = (user.aiRequestCount || 0) + 1;
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}

/**
 * Updates user's lastActive timestamp.
 */
export async function updateLastActive(telegramId: number): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}

/**
 * Updates user's lastCommand field.
 */
export async function updateLastCommand(telegramId: number, command: string): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.lastCommand = command;
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}

/**
 * Updates user's lastFunction field.
 */
export async function updateLastFunction(telegramId: number, functionName: string): Promise<User | null> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) return null;
  const now = new Date().toISOString();
  user.lastFunction = functionName;
  user.lastActive = now;
  user.updatedAt = now;
  return saveUser(user);
}
