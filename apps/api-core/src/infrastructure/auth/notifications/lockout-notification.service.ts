import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

export interface ILockoutNotificationService {
  notify(email: string, adminUserId: string): Promise<void>;
}

/**
 * Issue #15: Wired to real NotificationsService — sends WebSocket notification to admins.
 * Previously was log-only stub.
 */
@Injectable()
export class LockoutNotificationService implements ILockoutNotificationService {
  private readonly logger = new Logger(LockoutNotificationService.name);

  constructor(private readonly notifications: NotificationsService) {}

  async notify(email: string, adminUserId: string): Promise<void> {
    const message = `⚠️ Security alert: Multiple failed login attempts for "${email}". Account temporarily locked.`;
    this.logger.warn(`Lockout notification for ${email} (${adminUserId})`);

    await this.notifications.notifyAdmins('security_alert', message, `/admin/users`);
  }
}
