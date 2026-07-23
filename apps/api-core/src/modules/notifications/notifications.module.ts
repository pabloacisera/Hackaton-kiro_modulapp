import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../interface/auth/guards/jwt-auth.guard';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    JwtService,
    Reflector,
    JwtAuthGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
