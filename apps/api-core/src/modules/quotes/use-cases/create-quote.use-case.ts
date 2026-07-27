import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { QuoteEmailService } from '../services/quote-email.service';

export interface CreateQuoteInput {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  description?: string | null;
  neededByDate?: string | null; // ISO date string
}

/**
 * TASK-quoteB-3: POST /quotes — validates name/email/phone.
 * TASK-quoteB-4: If anything is missing, creates discarded record + notifies admin.
 * TASK-quoteB-5: Sends confirmation email to customer on success.
 */
@Injectable()
export class CreateQuoteUseCase {
  private readonly logger = new Logger(CreateQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: QuoteEmailService,
  ) {}

  async execute(input: CreateQuoteInput): Promise<{ quote: Quote; discarded: boolean }> {
    const { customerName, customerEmail, customerPhone, description, neededByDate } = input;

    // Check mandatory fields
    const missingFields: string[] = [];
    if (!customerName || customerName.trim().length === 0) missingFields.push('name');
    if (!customerEmail || !customerEmail.includes('@')) missingFields.push('email');
    if (!customerPhone || customerPhone.trim().length === 0) missingFields.push('phone');

    if (missingFields.length > 0) {
      // TASK-quoteB-4: Discard path
      const reason = `Missing mandatory fields: ${missingFields.join(', ')}`;
      const discarded = Quote.createDiscarded(
        customerName ?? null,
        customerEmail ?? null,
        customerPhone ?? null,
        description ?? null,
        neededByDate ? new Date(neededByDate) : null,
        reason,
      );
      await this.quoteRepo.save(discarded);

      // Notify admin about discarded request
      await this.notifications.notifyAdmins(
        'new_quote_request',
        `Quote request discarded: ${reason}. Partial data: email=${customerEmail ?? '(none)'}`,
        `/admin/quotes?q=${discarded.id}`,
      );

      this.logger.warn(`Quote discarded: ${reason}`);
      return { quote: discarded, discarded: true };
    }

    // Valid request — create pending quote
    const quote = Quote.create(
      customerName!,
      customerEmail!,
      customerPhone!,
      description ?? '',
      neededByDate ? new Date(neededByDate) : new Date(),
    );
    await this.quoteRepo.save(quote);

    // Notify admin
    await this.notifications.notifyAdmins(
      'new_quote_request',
      `New quote request from ${quote.customerName} (${quote.customerEmail})`,
      `/admin/quotes?q=${quote.id}`,
    );

    // Send confirmation email to customer
    await this.emailService.sendRequestReceived(quote.customerEmail, quote.customerName, quote.id);

    this.logger.log(`Quote created: ${quote.id} — status: pending`);
    return { quote, discarded: false };
  }
}
