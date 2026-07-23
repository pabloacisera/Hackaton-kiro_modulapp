import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SuppliesModule } from './modules/supplies/supplies.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    CatalogModule,
    NotificationsModule,
    OrdersModule,
    QuotesModule,
    SuppliesModule,
    ComplaintsModule,
  ],
})
export class AppModule {}
