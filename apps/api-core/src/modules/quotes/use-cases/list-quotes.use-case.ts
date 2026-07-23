import { Injectable, Inject } from '@nestjs/common';
import {
  IQuoteRepository,
  ListQuotesFilter,
  PaginatedQuotes,
  QUOTE_REPOSITORY,
} from '../repositories/quote.repository.port';

/**
 * TASK-quoteB-16: Admin listing GET /quotes with filters/search/pagination.
 */
@Injectable()
export class ListQuotesUseCase {
  constructor(@Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository) {}

  async execute(filter: ListQuotesFilter): Promise<PaginatedQuotes> {
    return this.quoteRepo.findAll(filter);
  }
}
