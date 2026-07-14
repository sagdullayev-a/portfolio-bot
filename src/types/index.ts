/**
 * Supported notification types.
 * Each type maps to a specific emoji and message category.
 */
export type NotificationType = 'contact_form' | 'deploy' | 'server_error' | 'website_event';

/**
 * Payload options required to send an admin notification.
 */
export interface NotifyOptions {
  type: NotificationType;
  title: string;
  details: Record<string, string>;
}
