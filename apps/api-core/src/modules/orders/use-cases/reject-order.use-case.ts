import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import { PaymentServiceClient } from '../services/payment-service.client';
import { OrderEmailService } from '../services/order-email.service';

/**
 * TASK-directpurchase-9: Admin rejects an order.
 *
 * FR4: Mandatory reason + automatic refund via payment-service.
 * Acceptance criteria: rejection ALWAYS triggers refund; no stock deduction.
 */
@Injectable()
export class RejectOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    private readonly paymentClient: PaymentServiceClient,
    private readonly emailService: OrderEmailService,
  ) {}

  async execute(orderId: string, reason: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'paid_pending_acceptance') {
      throw new BadRequestException(
        `Cannot reject order in status: ${order.status}`,
      );
    }

    // ── Transition to rejected ────────────────────────────────────────────
    const rejected = order.reject(reason);
    await this.orderRepo.update(rejected);

    // ── Automatic refund via payment-service ──────────────────────────────
    // Idempotency key: order-refund-{orderId} — deterministic, safe to retry
    await this.paymentClient.refund({
      referenceId:     orderId,
      reason:          reason,
      refundRequestId: `order-refund-${orderId}`,
    });

    // ── Notify customer ───────────────────────────────────────────────────
    await this.emailService.sendOrderRejection(order.customerEmail, orderId, reason);
  }
}
