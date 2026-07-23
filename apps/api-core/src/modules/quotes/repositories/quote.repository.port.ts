import { Quote, QuoteStatus } from '../domain/quote.entity';

export interface ListQuotesFilter {
  status?: QuoteStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedQuotes {
  items: Quote[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IQuoteRepository {
  findById(id: string): Promise<Quote | null>;
  findByPaymentServiceRef(ref: string): Promise<Quote | null>;
  findExpiredQuotes(now: Date): Promise<Quote[]>;
  findPaymentExpiredQuotes(now: Date): Promise<Quote[]>;
  findAll(filter: ListQuotesFilter): Promise<PaginatedQuotes>;
  save(quote: Quote): Promise<Quote>;
  update(quote: Quote): Promise<Quote>;
}

export const QUOTE_REPOSITORY = Symbol('IQuoteRepository');
