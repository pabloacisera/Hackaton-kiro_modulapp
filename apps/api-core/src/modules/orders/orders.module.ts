import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

import { OrdersController } from './controllers/orders.controller';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { AcceptOrderUseCase } from './use-cases/accept-order.use-case';
import { RejectOrderUseCase } from './use-cases/reject-order.use-case';
import { ListOrdersUseCase } from './use-cases/list-orders.use-case';
import { HandlePaymentWebhookUseCase } from './use-cases/handle-payment-webhook.use-case';
import { PaymentServiceClient } from './services/payment-service.client';
import { OrderEmailService } from './services/order-email.service';
import { PaymentReconciliationJob } from './jobs/payment-reconciliation.job';
import { ORDER_REPOSITORY } from './repositories/order.repository.port';
import { InMemoryOrderRepository } from './repositories/in-memory-order.repository';

import { PROTOTYPE_REPOSITORY } from '../catalog/repositories/prototype.repository.port';
import { InMemoryPrototypeRepository } from '../catalog/repositories/in-memory-prototype.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { JwtAuthGuard } from '../../interface/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    HttpModule.register({ timeout: 15_000 }),
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY,     useClass: InMemoryOrderRepository },
    { provide: PROTOTYPE_REPOSITORY, useClass: InMemoryPrototypeRepository },

    JwtService,
    Reflector,
    JwtAuthGuard,

    PaymentServiceClient,
    OrderEmailService,

    CreateOrderUseCase,
    AcceptOrderUseCase,
    RejectOrderUseCase,
    ListOrdersUseCase,
    HandlePaymentWebhookUseCase,
    PaymentReconciliationJob,
  ],
  exports: [ListOrdersUseCase, HandlePaymentWebhookUseCase],
})
export class OrdersModule {}
