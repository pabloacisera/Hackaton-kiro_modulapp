import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { QuoteEmailService } from '../services/quote-email.service';

/**
 * TASK-quoteB-webhook: Webhook endpoint for payment-service to confirm payment.
 * Transitions payment_initiated → paid, sends confirmation email, notifies admin.
 */
@Injectable()
export class QuotePaymentWebhookUseCase {
  private readonly logger = new Logger(QuotePaymentWebhookUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: QuoteEmailService,
  ) {}

  async execute(paymentServiceRef: string, success: boolean): Promise<Quote> {
    const quote = await this.quoteRepo.findByPaymentServiceRef(paymentServiceRef);
    if (!quote) {
      throw new Error(`Quote not found for payment ref: ${paymentServiceRef}`);
    }

    if (quote.status === 'paid') {
      // Idempotent: already processed, return current state
      this.logger.warn(`Duplicate webhook for quote ${quote.id} — already paid`);
      return quote;
    }

    if (!success) {
      // Payment failed — expire
      const expired = quote.expirePayment();
      await this.quoteRepo.update(expired);

      await this.notifications.notifyAdmins(
        'payment_confirmed',
        `Payment FAILED for quote ${quote.id} (${quote.customerEmail})`,
        `/admin/quotes/${quote.id}`,
      );

      this.logger.warn(`Payment failed for quote ${quote.id}`);
      return expired;
    }

    // Success: payment_initiated → paid
    const paid = quote.confirmPayment();
    await this.quoteRepo.update(paid);

    // Send confirmation email to customer
    await this.emailService.sendPaymentConfirmation(
      paid.customerEmail,
      paid.id,
      paid.quotedPriceUsd!,
    );

    // Notify admin
    await this.notifications.notifyAdmins(
      'payment_confirmed',
      `Payment confirmed for quote ${paid.id} from ${paid.customerEmail} — USD ${paid.quotedPriceUsd}`,
      `/admin/quotes/${paid.id}`,
    );

    this.logger.log(`Quote ${paid.id} payment confirmed`);
    return paid;
  }
}
