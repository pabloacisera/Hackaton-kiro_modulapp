import { Injectable, Inject, Logger } from '@nestjs/common';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * TASK-quoteB-13: BullMQ job `quote-expiration-check`.
 * Runs periodically; finds `quoted` quotes past 48h deadline → marks as `expired`.
 *
 * TASK-quoteB-14: BullMQ job `quote-payment-expiration-check`.
 * Finds `accepted`/`payment_initiated` quotes past 24h payment deadline → marks as `payment_expired`.
 */
@Injectable()
export class QuoteExpirationJob {
  private readonly logger = new Logger(QuoteExpirationJob.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * TASK-quoteB-13: Check for quotes past their 48h response deadline.
   */
  async checkResponseExpiration(): Promise<number> {
    const now = new Date();
    const expiredQuotes = await this.quoteRepo.findExpiredQuotes(now);

    let count = 0;
    for (const quote of expiredQuotes) {
      try {
        const expired = quote.expire();
        await this.quoteRepo.update(expired);

        await this.notifications.notifyAdmins(
          'quote_response',
          `Quote ${quote.id} expired (48h, no response from ${quote.customerEmail})`,
          `/admin/quotes/${quote.id}`,
        );

        count++;
      } catch (err) {
        this.logger.error(`Failed to expire quote ${quote.id}: ${(err as Error).message}`);
      }
    }

    if (count > 0) {
      this.logger.log(`Expired ${count} quote(s) past response deadline`);
    }
    return count;
  }

  /**
   * TASK-quoteB-14: Check for quotes past their 24h payment deadline.
   */
  async checkPaymentExpiration(): Promise<number> {
    const now = new Date();
    const expiredQuotes = await this.quoteRepo.findPaymentExpiredQuotes(now);

    let count = 0;
    for (const quote of expiredQuotes) {
      try {
        const expired = quote.expirePayment();
        await this.quoteRepo.update(expired);

        await this.notifications.notifyAdmins(
          'payment_confirmed',
          `Payment expired for quote ${quote.id} (24h, no payment from ${quote.customerEmail})`,
          `/admin/quotes/${quote.id}`,
        );

        count++;
      } catch (err) {
        this.logger.error(
          `Failed to expire payment for quote ${quote.id}: ${(err as Error).message}`,
        );
      }
    }

    if (count > 0) {
      this.logger.log(`Expired ${count} quote(s) past payment deadline`);
    }
    return count;
  }
}
