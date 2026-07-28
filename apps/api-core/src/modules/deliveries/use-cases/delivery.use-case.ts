import { Injectable, Inject, Logger } from '@nestjs/common';
import { DeliveryTracking, DeliveryStatus, DeliveryOrigin } from '../domain/delivery-item.entity';
import {
  IDeliveryTrackingRepository,
  DELIVERY_TRACKING_REPOSITORY,
  ListDeliveryTrackingFilter,
} from '../repositories/delivery-tracking.repository.port';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../orders/repositories/order.repository.port';
import { Order } from '../../orders/domain/order.entity';

export interface ListDeliveriesFilter {
  status?: DeliveryStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface DeliveryViewItem {
  id: string;
  origin: DeliveryOrigin;
  customerName: string;
  customerEmail: string;
  estimatedDeliveryDate: Date;
  status: DeliveryStatus | 'overdue';
  deliveredAt: Date | null;
}

export interface PaginatedDeliveries {
  items: DeliveryViewItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DeliveryUseCase {
  private readonly logger = new Logger(DeliveryUseCase.name);

  constructor(
    @Inject(DELIVERY_TRACKING_REPOSITORY)
    private readonly trackingRepo: IDeliveryTrackingRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
  ) {}

  async list(filter: ListDeliveriesFilter): Promise<PaginatedDeliveries> {
    const now = new Date();
    const repoFilter: ListDeliveryTrackingFilter = { ...filter };
    const result = await this.trackingRepo.findAll(repoFilter);

    const items: DeliveryViewItem[] = result.items.map((t) => {
      const isOverdue = DeliveryTracking.isOverdue(t.estimatedDeliveryDate, t.deliveredAt, now);
      return {
        id: t.quoteId ?? t.id,
        origin: t.origin,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        estimatedDeliveryDate: t.estimatedDeliveryDate,
        status: t.deliveredAt ? 'delivered' : isOverdue ? 'overdue' : 'pending',
        deliveredAt: t.deliveredAt,
      };
    });

    let filtered = items;
    if (filter.status) {
      filtered = items.filter((i) => i.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.customerName.toLowerCase().includes(q) || i.customerEmail.toLowerCase().includes(q),
      );
    }

    const total = filtered.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async deliver(origin: DeliveryOrigin, id: string): Promise<void> {
    let orderId: string;

    if (origin === 'order') {
      orderId = id;
    } else {
      const order = await this.orderRepo.findByQuoteId(id);
      if (!order) throw new Error(`Order not found for quote: ${id}`);
      orderId = order.id;
    }

    const tracking = await this.trackingRepo.findByOrderId(orderId);
    if (!tracking) throw new Error(`Delivery tracking not found for order: ${orderId}`);

    const delivered = tracking.deliver();
    await this.trackingRepo.update(delivered);
    this.logger.log(`Delivery marked as delivered: order ${orderId}`);
  }

  async postpone(origin: DeliveryOrigin, id: string, newDate: Date): Promise<void> {
    if (newDate.getTime() <= Date.now()) {
      throw new Error('New delivery date must be in the future');
    }

    let orderId: string;

    if (origin === 'order') {
      orderId = id;
    } else {
      const order = await this.orderRepo.findByQuoteId(id);
      if (!order) throw new Error(`Order not found for quote: ${id}`);
      orderId = order.id;
    }

    const tracking = await this.trackingRepo.findByOrderId(orderId);
    if (!tracking) throw new Error(`Delivery tracking not found for order: ${orderId}`);

    const postponed = tracking.postpone(newDate);
    await this.trackingRepo.update(postponed);

    const order = await this.orderRepo.findById(orderId);
    if (order) {
      const updated = new Order({
        ...order.toProps(),
        estimatedDeliveryDate: newDate,
        updatedAt: new Date(),
      });
      await this.orderRepo.update(updated);
    }

    this.logger.log(`Delivery postponed for order ${orderId} to ${newDate.toISOString()}`);
  }
}
