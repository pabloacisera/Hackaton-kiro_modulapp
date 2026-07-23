import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { QuoteTokenService } from '../services/quote-token.service';
import { QuoteEmailService } from '../services/quote-email.service';

export interface PresentQuoteInput {
  quoteId: string;
  priceUsd: number;
  leadTimeDays: number;
  estimatedDeliveryDate: string; // ISO date
}

/**
 * TASK-quoteB-6: PATCH /quotes/:id/present — admin presents a quote.
 * TASK-quoteB-7: Generates signed token.
 * TASK-quoteB-8: Sends email with accept/reject buttons.
 */
@Injectable()
export class PresentQuoteUseCase {
  private readonly logger = new Logger(PresentQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly tokenService: QuoteTokenService,
    private readonly emailService: QuoteEmailService,
  ) {}

  async execute(input: PresentQuoteInput): Promise<Quote> {
    const { quoteId, priceUsd, leadTimeDays, estimatedDeliveryDate } = input;

    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    // Calculate the 48h deadline for the token
    const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const { token, tokenHash } = this.tokenService.generateToken(quoteId, responseDeadline);

    // Transition state
    const quoted = quote.presentQuote(
      priceUsd,
      leadTimeDays,
      new Date(estimatedDeliveryDate),
      tokenHash,
    );
    await this.quoteRepo.update(quoted);

    // Build accept/reject URLs
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
    const acceptUrl = `${baseUrl}/api/quotes/${quoteId}/accept?token=${token}`;
    const rejectUrl = `${baseUrl}/api/quotes/${quoteId}/reject?token=${token}`;

    // Send email
    await this.emailService.sendQuotePresented(
      quoted.customerEmail,
      quoted.customerName,
      quoteId,
      priceUsd,
      leadTimeDays,
      acceptUrl,
      rejectUrl,
    );

    this.logger.log(`Quote ${quoteId} presented: USD ${priceUsd}, ${leadTimeDays} days`);
    return quoted;
  }
}
