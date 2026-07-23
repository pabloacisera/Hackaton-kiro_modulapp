import { Injectable, Logger } from '@nestjs/common';
import {
  AdminNotification,
  NotificationType,
} from './domain/admin-notification.entity';

/**
 * TASK-notif-2: Central notification service.
 * `notifyAdmins()` is the single entry point used by every other module.
 * Persists + broadcasts via WebSocket (when gateway is connected).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** In-memory store — replace with Prisma in production. */
  private readonly notifications: AdminNotification[] = [];

  /** WebSocket gateway injects itself here to avoid circular dependency. */
  private broadcastFn: ((n: AdminNotification) => void) | null = null;

  registerBroadcast(fn: (n: AdminNotification) => void): void {
    this.broadcastFn = fn;
  }

  /**
   * Creates, persists, and broadcasts a new notification to all admins.
   */
  async notifyAdmins(
    type: NotificationType,
    message: string,
    referenceUrl: string,
  ): Promise<AdminNotification> {
    const notification = AdminNotification.create(type, message, referenceUrl);
    this.notifications.push(notification);

    this.logger.log(`Notification [${type}]: ${message}`);

    if (this.broadcastFn) {
      try {
        this.broadcastFn(notification);
      } catch (err) {
        this.logger.error(`Broadcast failed: ${err}`);
      }
    }

    return notification;
  }

  async findUnread(): Promise<AdminNotification[]> {
    return this.notifications.filter((n) => !n.read);
  }

  async findAll(read?: boolean): Promise<AdminNotification[]> {
    if (read === undefined) return [...this.notifications];
    return this.notifications.filter((n) => n.read === read);
  }

  async markRead(id: string): Promise<AdminNotification | null> {
    const idx = this.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    const updated = this.notifications[idx].markRead();
    this.notifications[idx] = updated;
    return updated;
  }
}
