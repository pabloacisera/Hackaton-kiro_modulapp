import { Module, forwardRef } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesController } from './controllers/deliveries.controller';
import { DeliveryUseCase } from './use-cases/delivery.use-case';
import { DELIVERY_TRACKING_REPOSITORY } from './repositories/delivery-tracking.repository.port';
import { PrismaDeliveryTrackingRepository } from '../../infrastructure/prisma/repositories/prisma-delivery-tracking.repository';

@Module({
  imports: [forwardRef(() => OrdersModule), AuthModule],
  controllers: [DeliveriesController],
  providers: [
    DeliveryUseCase,
    {
      provide: DELIVERY_TRACKING_REPOSITORY,
      useClass: PrismaDeliveryTrackingRepository,
    },
  ],
  exports: [DELIVERY_TRACKING_REPOSITORY],
})
export class DeliveriesModule {}
