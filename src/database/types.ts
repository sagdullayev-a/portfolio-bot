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

export type ActionType =
  | 'START'
  | 'COMMAND'
  | 'AI_CHAT'
  | 'TEXT'
  | 'PHOTO'
  | 'VOICE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'STICKER'
  | 'CONTACT'
  | 'LOCATION'
  | 'CALLBACK'
  | 'ERROR'
  | 'UNAUTHORIZED';

export interface ActivityLog {
  id: string;
  userId?: string;
  telegramId: number;
  action: ActionType;
  message?: string | null;
  messageId?: number;
  chatId?: number;
  chatType?: string;
  createdAt: string;
}
