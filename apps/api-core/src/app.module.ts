import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [HealthModule, AuthModule, CatalogModule, NotificationsModule],
})
export class AppModule {}
