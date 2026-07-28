import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { QuoteEmailService } from '../services/quote-email.service';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../orders/repositories/order.repository.port';
import { Order } from '../../orders/domain/order.entity';
import {
  IDeliveryTrackingRepository,
  DELIVERY_TRACKING_REPOSITORY,
} from '../../deliveries/repositories/delivery-tracking.repository.port';
import { DeliveryTracking } from '../../deliveries/domain/delivery-item.entity';

@Injectable()
export class QuotePaymentWebhookUseCase {
  private readonly logger = new Logger(QuotePaymentWebhookUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(DELIVERY_TRACKING_REPOSITORY)
    private readonly deliveryRepo: IDeliveryTrackingRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: QuoteEmailService,
  ) {}

  async execute(paymentServiceRef: string, success: boolean): Promise<Quote> {
    const quote = await this.quoteRepo.findByPaymentServiceRef(paymentServiceRef);
    if (!quote) {
      throw new Error(`Quote not found for payment ref: ${paymentServiceRef}`);
    }

    if (quote.status === 'paid') {
      this.logger.warn(`Duplicate webhook for quote ${quote.id} — already paid`);
      return quote;
    }

    if (!success) {
      const expired = quote.expirePayment();
      await this.quoteRepo.update(expired);

      await this.notifications.notifyAdmins(
        'payment_confirmed',
        `Payment FAILED for quote ${quote.id} (${quote.customerEmail})`,
        `/admin/quotes?q=${quote.id}`,
      );

      this.logger.warn(`Payment failed for quote ${quote.id}`);
      return expired;
    }

    const paid = quote.confirmPayment();
    await this.quoteRepo.update(paid);

    const order = Order.createFromQuote(
      paid.id,
      paid.quotedPriceUsd!,
      paid.customerEmail,
      paid.customerName,
      paid.estimatedDeliveryDate!,
      paymentServiceRef,
    );
    await this.orderRepo.save(order);

    const tracking = new DeliveryTracking({
      id: crypto.randomUUID(),
      orderId: order.id,
      origin: 'quote',
      customerName: order.customerName ?? order.customerEmail,
      customerEmail: order.customerEmail,
      quoteId: paid.id,
      estimatedDeliveryDate: paid.estimatedDeliveryDate!,
      status: 'pending',
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.deliveryRepo.save(tracking);

    await this.emailService.sendPaymentConfirmation(
      paid.customerEmail,
      paid.id,
      paid.quotedPriceUsd!,
    );

    await this.notifications.notifyAdmins(
      'payment_confirmed',
      `Payment confirmed for quote ${paid.id} from ${paid.customerEmail} — USD ${paid.quotedPriceUsd}`,
      `/admin/quotes?q=${paid.id}`,
    );

    this.logger.log(`Quote ${paid.id} payment confirmed — order ${order.id} created`);
    return paid;
  }
}
