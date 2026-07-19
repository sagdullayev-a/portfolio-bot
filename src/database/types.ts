/**
 * Database Types & Interfaces
 */

export interface User {
  id: string;
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
  isBot?: boolean;
  addedToAttachmentMenu?: boolean;
  chatId: number;
  chatType?: string;
  registeredAt: string;
  lastActive: string;
  messageCount: number;
  commandCount: number;
  aiRequestCount: number;
  lastCommand?: string | null;
  lastFunction?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  telegramId: number;
  action: string;
  message?: string | null;
  createdAt: string;
}
