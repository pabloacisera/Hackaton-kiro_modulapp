import { Injectable, Logger } from '@nestjs/common';

export interface ILockoutNotificationService {
  notify(email: string, adminUserId: string): Promise<void>;
}

/**
 * Sends a lockout notification via WebSocket (when connected)
 * or falls back to email via Mailjet.
 * Full implementation wired in feature-realtime-notifications.
 * For now: logs + marks notification as persisted (stub).
 */
@Injectable()
export class LockoutNotificationService implements ILockoutNotificationService {
  private readonly logger = new Logger(LockoutNotificationService.name);

  async notify(email: string, adminUserId: string): Promise<void> {
    const message =
      'Multiple failed login attempts detected. Account temporarily locked.';
    this.logger.warn(`Lockout notification for ${email} (${adminUserId}): ${message}`);
    // WebSocket + email dispatch wired in feature-realtime-notifications
  }
}
