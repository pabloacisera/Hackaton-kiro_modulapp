import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../interface/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

/**
 * TASK-notif-4: GET /admin/notifications endpoint.
 */
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Query('read') read?: string) {
    const readFilter =
      read === 'true' ? true : read === 'false' ? false : undefined;
    return this.notificationsService.findAll(readFilter);
  }
}
