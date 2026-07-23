import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, ListQuotesFilter, PaginatedQuotes } from './quote.repository.port';

/**
 * In-memory implementation for testing and initial development.
 * Replace with Prisma-backed implementation when DB is connected.
 */
export class InMemoryQuoteRepository implements IQuoteRepository {
  private quotes: Quote[] = [];

  async findById(id: string): Promise<Quote | null> {
    return this.quotes.find((q) => q.id === id) ?? null;
  }

  async findByPaymentServiceRef(ref: string): Promise<Quote | null> {
    return this.quotes.find((q) => q.paymentServiceRef === ref) ?? null;
  }

  async findExpiredQuotes(now: Date): Promise<Quote[]> {
    return this.quotes.filter(
      (q) =>
        q.status === 'quoted' &&
        q.quoteResponseDeadline !== null &&
        now.getTime() > q.quoteResponseDeadline.getTime(),
    );
  }

  async findPaymentExpiredQuotes(now: Date): Promise<Quote[]> {
    return this.quotes.filter(
      (q) =>
        (q.status === 'accepted' || q.status === 'payment_initiated') &&
        q.paymentDeadline !== null &&
        now.getTime() > q.paymentDeadline.getTime(),
    );
  }

  async findAll(filter: ListQuotesFilter): Promise<PaginatedQuotes> {
    let items = [...this.quotes];

    // Exclude discarded from default listing unless explicitly filtered
    if (filter.status) {
      items = items.filter((q) => q.status === filter.status);
    } else {
      items = items.filter((q) => q.status !== 'discarded_incomplete_data');
    }

    if (filter.q) {
      const query = filter.q.toLowerCase();
      items = items.filter(
        (q) =>
          q.customerName.toLowerCase().includes(query) ||
          q.customerEmail.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query),
      );
    }

    const total = items.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    items = items.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  async save(quote: Quote): Promise<Quote> {
    this.quotes.push(quote);
    return quote;
  }

  async update(quote: Quote): Promise<Quote> {
    const idx = this.quotes.findIndex((q) => q.id === quote.id);
    if (idx === -1) {
      throw new Error(`Quote not found: ${quote.id}`);
    }
    this.quotes[idx] = quote;
    return quote;
  }

  // Test helper: clear all
  clear(): void {
    this.quotes = [];
  }
}
