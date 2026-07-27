import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { QuoteTokenService } from '../services/quote-token.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface RejectQuoteResult {
  quote: Quote;
  alreadyProcessed: boolean;
  expired: boolean;
}

/**
 * TASK-quoteB-10: GET /quotes/:id/reject — same security criteria as accept.
 * TASK-quoteB-11: Admin notification on rejection.
 */
@Injectable()
export class RejectQuoteUseCase {
  private readonly logger = new Logger(RejectQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly tokenService: QuoteTokenService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(quoteId: string, token: string): Promise<RejectQuoteResult> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    // If already processed, return current state — safe no-op
    if (quote.actionTokenUsed) {
      return { quote, alreadyProcessed: true, expired: false };
    }

    // Verify token
    let payload;
    try {
      payload = this.tokenService.verifyToken(token);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Token has expired') {
        return { quote, alreadyProcessed: false, expired: true };
      }
      throw new Error(`Invalid token: ${message}`);
    }

    if (payload.quoteId !== quoteId) {
      throw new Error('Token does not match this quote');
    }

    const tokenHash = this.tokenService.hashToken(token);
    if (tokenHash !== quote.actionTokenHash) {
      throw new Error('Token mismatch');
    }

    if (quote.isResponseExpired()) {
      return { quote, alreadyProcessed: false, expired: true };
    }

    // Transition: quoted → rejected (marks token as used)
    const rejected = quote.reject();
    await this.quoteRepo.update(rejected);

    // TASK-quoteB-11: Notify admin
    await this.notifications.notifyAdmins(
      'quote_response',
      `Quote ${quoteId} was rejected by ${quote.customerEmail}`,
      `/admin/quotes?q=${quoteId}`,
    );

    this.logger.log(`Quote ${quoteId} rejected by customer`);
    return { quote: rejected, alreadyProcessed: false, expired: false };
  }
}
