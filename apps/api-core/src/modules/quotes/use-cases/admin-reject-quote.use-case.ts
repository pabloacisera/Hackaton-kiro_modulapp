import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { QuoteEmailService } from '../services/quote-email.service';

/**
 * Admin rejects a pending quote request — the customer is notified by email.
 * Valid from: pending status only.
 */
@Injectable()
export class AdminRejectQuoteUseCase {
  private readonly logger = new Logger(AdminRejectQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: QuoteEmailService,
  ) {}

  async execute(quoteId: string, reason: string): Promise<Quote> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const rejected = quote.adminReject(reason);
    await this.quoteRepo.update(rejected);

    // Notify customer by email
    await this.emailService.sendRequestRejected(
      quote.customerEmail,
      quote.customerName,
      quoteId,
      reason,
    );

    this.logger.log(`Quote ${quoteId} rejected by admin: ${reason}`);
    return rejected;
  }
}
