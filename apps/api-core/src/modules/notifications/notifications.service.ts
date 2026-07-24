import { Injectable, Logger } from '@nestjs/common';
import { AdminNotification, NotificationType } from './domain/admin-notification.entity';
import { PrismaNotificationRepository } from '../../infrastructure/prisma/repositories/prisma-notification.repository';

/**
 * TASK-notif-2: Central notification service.
 * `notifyAdmins()` is the single entry point used by every other module.
 * Persists via Prisma + broadcasts via WebSocket (when gateway is connected).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** WebSocket gateway injects itself here to avoid circular dependency. */
  private broadcastFn: ((n: AdminNotification) => void) | null = null;

  constructor(private readonly repo: PrismaNotificationRepository) {}

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
    await this.repo.save(notification);

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
    return this.repo.findUnread();
  }

  async findAll(read?: boolean): Promise<AdminNotification[]> {
    return this.repo.findAll(read);
  }

  async markRead(id: string): Promise<AdminNotification | null> {
    return this.repo.markRead(id);
  }
}
