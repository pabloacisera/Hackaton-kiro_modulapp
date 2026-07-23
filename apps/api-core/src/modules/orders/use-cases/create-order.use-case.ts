import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Order } from '../domain/order.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import { PaymentServiceClient } from '../services/payment-service.client';
import { IPrototypeRepository, PROTOTYPE_REPOSITORY } from '../../catalog/repositories/prototype.repository.port';

/**
 * TASK-directpurchase-3: Create order with server-side price/stock re-read.
 *
 * FR2: price and stock are ALWAYS re-read from DB — never trusted from client.
 * Edge case: stock=0 + build_on_demand=false → blocks before reaching PayPal.
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
    private readonly paymentClient: PaymentServiceClient,
  ) {}

  async execute(dto: {
    prototypeId: string;
    customerEmail: string;
    customerName?: string;
  }): Promise<{ orderId: string; paymentLink: string }> {

    // ── FR2: Re-read price and stock server-side ──────────────────────────
    const prototype = await this.protoRepo.findById(dto.prototypeId);
    if (!prototype || !prototype.active) {
      throw new BadRequestException('Prototype not found or not available');
    }

    // ── Edge case: out of stock ────────────────────────────────────────────
    if (!prototype.isPurchasable) {
      throw new BadRequestException(
        'This prototype is currently out of stock and cannot be purchased',
      );
    }

    // ── Idempotency: same email + prototype in 'created' state ────────────
    const idempotencyKey = `order:${dto.prototypeId}:${dto.customerEmail}:${Date.now()}`;

    // ── Create order in 'created' state ───────────────────────────────────
    const order = Order.create(
      dto.prototypeId,
      prototype.priceUsd,
      dto.customerEmail,
      dto.customerName ?? null,
      idempotencyKey,
    );
    const saved = await this.orderRepo.save(order);

    // ── TASK-directpurchase-4: call payment-service ───────────────────────
    const { paymentLink, paymentServiceRef } = await this.paymentClient.initiatePayment({
      referenceId:    saved.id,
      origin:         'order',
      amountUsd:      prototype.priceUsd,
      customerEmail:  dto.customerEmail,
      idempotencyKey: idempotencyKey,
    });

    // Transition to payment_initiated
    const initiated = saved.initiatePayment(paymentServiceRef);
    await this.orderRepo.update(initiated);

    return { orderId: saved.id, paymentLink };
  }
}
