import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { OrderEmailService } from '../services/order-email.service';
import { IPrototypeRepository, PROTOTYPE_REPOSITORY } from '../../catalog/repositories/prototype.repository.port';

/**
 * TASK-directpurchase-5: Handle payment-result webhook from payment-service.
 *
 * FR3: On payment OK:
 *   - Move order to paid_pending_acceptance
 *   - Send confirmation email to customer (mandatory)
 *   - Notify admin via WebSocket
 *   Stock is NOT deducted here.
 */
@Injectable()
export class HandlePaymentWebhookUseCase {
  private readonly logger = new Logger(HandlePaymentWebhookUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: OrderEmailService,
  ) {}

  async execute(payload: {
    referenceId: string;
    paymentServiceRef: string;
    status: 'confirmed' | 'failed';
  }): Promise<void> {
    const order = await this.orderRepo.findById(payload.referenceId);
    if (!order) {
      throw new NotFoundException(`Order ${payload.referenceId} not found`);
    }

    if (payload.status === 'confirmed') {
      const confirmed = order.confirmPayment();
      await this.orderRepo.update(confirmed);

      // FR3: Confirmation email (fire-and-forget, email failure must not block)
      const proto = await this.protoRepo.findById(order.prototypeId);
      this.emailService
        .sendPaymentConfirmation(
          order.customerEmail,
          order.id,
          order.priceUsdSnapshot,
          proto?.estimatedDeliveryDays ?? null,
        )
        .catch((err) => this.logger.error(`Confirmation email failed: ${err}`));

      // TASK-directpurchase-7: WebSocket notification to admin
      await this.notifications.notifyAdmins(
        'new_purchase',
        `New order from ${order.customerEmail} — $${order.priceUsdSnapshot.toFixed(2)} pending acceptance`,
        `/admin/orders/${order.id}`,
      );

    } else {
      const failed = order.failPayment();
      await this.orderRepo.update(failed);
      this.logger.warn(`Payment failed for order ${order.id}`);
    }
  }
}
