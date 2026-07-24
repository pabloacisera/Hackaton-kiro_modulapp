import { Module, forwardRef } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { QuotesModule } from '../quotes/quotes.module';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesController } from './controllers/deliveries.controller';
import { DeliveryUseCase } from './use-cases/delivery.use-case';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    forwardRef(() => QuotesModule),
    AuthModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveryUseCase],
})
export class DeliveriesModule {}
