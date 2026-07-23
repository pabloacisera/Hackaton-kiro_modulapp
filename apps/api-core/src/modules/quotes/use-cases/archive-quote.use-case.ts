import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';

/**
 * TASK-quoteB-15: PATCH /quotes/:id/archive — admin archives rejected/expired/payment_expired.
 */
@Injectable()
export class ArchiveQuoteUseCase {
  private readonly logger = new Logger(ArchiveQuoteUseCase.name);

  constructor(@Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository) {}

  async execute(quoteId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const archived = quote.archive();
    await this.quoteRepo.update(archived);

    this.logger.log(`Quote ${quoteId} archived (was: ${quote.status})`);
    return archived;
  }
}
