import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryUseCase } from './use-cases/delivery.use-case';
import { ORDER_REPOSITORY } from '../orders/repositories/order.repository.port';
import { QUOTE_REPOSITORY } from '../quotes/repositories/quote.repository.port';
import { InMemoryOrderRepository } from '../orders/repositories/in-memory-order.repository';
import { InMemoryQuoteRepository } from '../quotes/repositories/in-memory-quote.repository';
import { Order } from '../orders/domain/order.entity';
import { Quote } from '../quotes/domain/quote.entity';

describe('Deliveries Module — Integration Tests', () => {
  let deliveryUseCase: DeliveryUseCase;
  let orderRepo: InMemoryOrderRepository;
  let quoteRepo: InMemoryQuoteRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
        { provide: QUOTE_REPOSITORY, useClass: InMemoryQuoteRepository },
        DeliveryUseCase,
      ],
    }).compile();

    deliveryUseCase = module.get(DeliveryUseCase);
    orderRepo = module.get(ORDER_REPOSITORY);
    quoteRepo = module.get(QUOTE_REPOSITORY);
  });

  async function seedAcceptedOrder(id: string, deliveryDate: Date): Promise<void> {
    const order = Order.create('proto-1', 100, 'customer@test.com', 'Customer', `idem-${id}`);
    const initiated = order.initiatePayment('pay-ref');
    const paid = initiated.confirmPayment();
    const accepted = paid.accept(deliveryDate);
    // Manually set id for testing
    const withId = new Order({ ...accepted.toProps(), id });
    await orderRepo.save(withId);
  }

  async function seedPaidQuote(id: string, deliveryDate: Date): Promise<void> {
    const quote = Quote.create(
      'QuoteCustomer',
      'qcust@test.com',
      '+54 11 555',
      'Custom arch',
      new Date('2026-09-01'),
    );
    const quoted = quote.presentQuote(200, 10, deliveryDate, 'hash');
    const accepted = new Quote({
      ...quoted.toProps(),
      status: 'accepted',
      acceptedAt: new Date(),
      actionTokenUsed: true,
      paymentDeadline: new Date(Date.now() + 86400000),
    });
    const initiated = accepted.initiatePayment('pay-q-ref');
    const paid = initiated.confirmPayment();
    const withId = new Quote({ ...paid.toProps(), id });
    await quoteRepo.save(withId);
  }

  describe('Projection (UNION)', () => {
    it('includes accepted orders', async () => {
      await seedAcceptedOrder('ord-1', new Date(Date.now() + 7 * 86400000));
      const result = await deliveryUseCase.list({});
      expect(result.total).toBe(1);
      expect(result.items[0].origin).toBe('order');
    });

    it('includes paid quotes', async () => {
      await seedPaidQuote('q-1', new Date(Date.now() + 14 * 86400000));
      const result = await deliveryUseCase.list({});
      expect(result.total).toBe(1);
      expect(result.items[0].origin).toBe('quote');
    });

    it('merges orders and quotes in single list sorted by date', async () => {
      await seedAcceptedOrder('ord-2', new Date(Date.now() + 10 * 86400000));
      await seedPaidQuote('q-2', new Date(Date.now() + 5 * 86400000));

      const result = await deliveryUseCase.list({});
      expect(result.total).toBe(2);
      // Quote has earlier date, should be first
      expect(result.items[0].origin).toBe('quote');
      expect(result.items[1].origin).toBe('order');
    });

    it('excludes non-deliverable statuses', async () => {
      // Create a non-accepted order (just created)
      const order = Order.create('proto-1', 50, 'x@t.com', 'X', 'idem-x');
      await orderRepo.save(order);

      const result = await deliveryUseCase.list({});
      expect(result.total).toBe(0);
    });
  });

  describe('Overdue calculation', () => {
    it('marks items with past delivery date as overdue', async () => {
      await seedAcceptedOrder('ord-overdue', new Date(Date.now() - 2 * 86400000)); // 2 days ago
      const result = await deliveryUseCase.list({});
      expect(result.items[0].status).toBe('overdue');
    });

    it('marks future items as pending', async () => {
      await seedAcceptedOrder('ord-future', new Date(Date.now() + 7 * 86400000));
      const result = await deliveryUseCase.list({});
      expect(result.items[0].status).toBe('pending');
    });
  });

  describe('Filter by status', () => {
    it('filters overdue only', async () => {
      await seedAcceptedOrder('ord-ok', new Date(Date.now() + 7 * 86400000));
      await seedAcceptedOrder('ord-late', new Date(Date.now() - 1 * 86400000));

      const result = await deliveryUseCase.list({ status: 'overdue' });
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('ord-late');
    });
  });

  describe('Postpone', () => {
    it('updates order estimated delivery date', async () => {
      await seedAcceptedOrder('ord-postpone', new Date(Date.now() + 3 * 86400000));
      const newDate = new Date(Date.now() + 14 * 86400000);

      await deliveryUseCase.postpone('order', 'ord-postpone', newDate);

      const order = await orderRepo.findById('ord-postpone');
      expect(order!.estimatedDeliveryDate!.getTime()).toBe(newDate.getTime());
    });

    it('rejects past date', async () => {
      await seedAcceptedOrder('ord-past', new Date(Date.now() + 3 * 86400000));
      const pastDate = new Date(Date.now() - 86400000);

      await expect(deliveryUseCase.postpone('order', 'ord-past', pastDate)).rejects.toThrow(
        'New delivery date must be in the future',
      );
    });
  });
});
