import { Order, OrderStatus } from '../domain/order.entity';

export interface ListOrdersFilter {
  status?: OrderStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findByPaymentServiceRef(ref: string): Promise<Order | null>;
  findHungPayments(olderThanMinutes: number): Promise<Order[]>;
  findAll(filter: ListOrdersFilter): Promise<PaginatedOrders>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
