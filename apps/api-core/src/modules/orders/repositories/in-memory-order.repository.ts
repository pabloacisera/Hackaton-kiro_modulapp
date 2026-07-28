import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '../domain/order.entity';
import { IOrderRepository, ListOrdersFilter, PaginatedOrders } from './order.repository.port';

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders = new Map<string, Order>();

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    for (const o of this.orders.values()) {
      if (o.idempotencyKey === key) return o;
    }
    return null;
  }

  async findByPaymentServiceRef(ref: string): Promise<Order | null> {
    for (const o of this.orders.values()) {
      if (o.paymentServiceRef === ref) return o;
    }
    return null;
  }

  async findByQuoteId(quoteId: string): Promise<Order | null> {
    for (const o of this.orders.values()) {
      if (o.quoteId === quoteId) return o;
    }
    return null;
  }

  async findHungPayments(olderThanMinutes: number): Promise<Order[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
    return [...this.orders.values()].filter(
      (o) => o.status === 'payment_initiated' && o.updatedAt < cutoff,
    );
  }

  async findAll(filter: ListOrdersFilter): Promise<PaginatedOrders> {
    let results = [...this.orders.values()];

    if (filter.status) {
      results = results.filter((o) => o.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      results = results.filter(
        (o) =>
          o.customerEmail.toLowerCase().includes(q) ||
          (o.customerName ?? '').toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      );
    }

    // Sort newest first
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const items = results.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async update(order: Order): Promise<Order> {
    if (!this.orders.has(order.id)) {
      throw new Error(`Order ${order.id} not found`);
    }
    this.orders.set(order.id, order);
    return order;
  }
}
