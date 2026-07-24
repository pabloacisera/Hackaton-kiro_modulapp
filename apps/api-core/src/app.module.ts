import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SuppliesModule } from './modules/supplies/supplies.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { SeedService } from './infrastructure/seed.service';

@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    StorageModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    NotificationsModule,
    OrdersModule,
    QuotesModule,
    SuppliesModule,
    ComplaintsModule,
    DeliveriesModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
