import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  AdminNotification,
  NotificationType,
} from '../../../modules/notifications/domain/admin-notification.entity';

/**
 * Prisma-backed notification persistence.
 * Replaces the in-memory array in NotificationsService.
 */
@Injectable()
export class PrismaNotificationRepository {
  private readonly logger = new Logger(PrismaNotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(notification: AdminNotification): Promise<AdminNotification> {
    const row = await this.prisma.adminNotification.create({
      data: {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        referenceUrl: notification.referenceUrl,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    });
    return this.toDomain(row);
  }

  async findAll(read?: boolean): Promise<AdminNotification[]> {
    const where = read !== undefined ? { read } : {};
    const rows = await this.prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findUnread(): Promise<AdminNotification[]> {
    return this.findAll(false);
  }

  async markRead(id: string): Promise<AdminNotification | null> {
    try {
      const row = await this.prisma.adminNotification.update({
        where: { id },
        data: { read: true },
      });
      return this.toDomain(row);
    } catch {
      return null;
    }
  }

  private toDomain(row: {
    id: string;
    type: string;
    message: string;
    referenceUrl: string;
    read: boolean;
    createdAt: Date;
  }): AdminNotification {
    return new AdminNotification({
      id: row.id,
      type: row.type as NotificationType,
      message: row.message,
      referenceUrl: row.referenceUrl,
      read: row.read,
      createdAt: row.createdAt,
    });
  }
}
