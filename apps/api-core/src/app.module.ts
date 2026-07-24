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
import { SeedService } from './infrastructure/seed.service';

@Module({
  imports: [
    PrismaModule,
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
