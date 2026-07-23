import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { QuoteTokenService } from '../services/quote-token.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface AcceptQuoteResult {
  quote: Quote;
  paymentUrl: string | null;
  alreadyProcessed: boolean;
  expired: boolean;
}

/**
 * TASK-quoteB-9: GET /quotes/:id/accept — token verification, expiration, single-use.
 * TASK-quoteB-12: Integration with payment-service to generate payment link.
 */
@Injectable()
export class AcceptQuoteUseCase {
  private readonly logger = new Logger(AcceptQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly tokenService: QuoteTokenService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(quoteId: string, token: string): Promise<AcceptQuoteResult> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    // If already processed (accepted/rejected/paid/etc.), return current state — safe no-op
    if (quote.actionTokenUsed) {
      return {
        quote,
        paymentUrl: null,
        alreadyProcessed: true,
        expired: false,
      };
    }

    // Verify token signature and expiration
    let payload;
    try {
      payload = this.tokenService.verifyToken(token);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Token has expired') {
        return { quote, paymentUrl: null, alreadyProcessed: false, expired: true };
      }
      throw new Error(`Invalid token: ${message}`);
    }

    // Verify token belongs to this quote
    if (payload.quoteId !== quoteId) {
      throw new Error('Token does not match this quote');
    }

    // Verify token hash matches stored hash
    const tokenHash = this.tokenService.hashToken(token);
    if (tokenHash !== quote.actionTokenHash) {
      throw new Error('Token mismatch');
    }

    // Check if response deadline has passed (double-check beyond JWT exp)
    if (quote.isResponseExpired()) {
      return { quote, paymentUrl: null, alreadyProcessed: false, expired: true };
    }

    // Transition: quoted → accepted (marks token as used atomically)
    const accepted = quote.accept();

    // Generate payment link via payment-service
    // TODO: Replace with real HTTP call to payment-service
    const paymentServiceRef = `PAY-QUOTE-${quoteId}-${Date.now()}`;
    const initiated = accepted.initiatePayment(paymentServiceRef);
    await this.quoteRepo.update(initiated);

    const paymentUrl = `${process.env.PAYPAL_BASE_URL || 'https://sandbox.paypal.com'}/pay/${paymentServiceRef}`;

    this.logger.log(`Quote ${quoteId} accepted, payment initiated: ${paymentServiceRef}`);

    return {
      quote: initiated,
      paymentUrl,
      alreadyProcessed: false,
      expired: false,
    };
  }
}
