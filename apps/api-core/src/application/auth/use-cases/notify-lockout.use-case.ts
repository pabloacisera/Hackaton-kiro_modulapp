import { Injectable } from '@nestjs/common';
import { LockoutNotificationService } from '../../../infrastructure/auth/notifications/lockout-notification.service';

@Injectable()
export class NotifyLockoutUseCase {
  constructor(private readonly notificationService: LockoutNotificationService) {}

  async execute(email: string, adminUserId: string): Promise<void> {
    await this.notificationService.notify(email, adminUserId);
  }
}
