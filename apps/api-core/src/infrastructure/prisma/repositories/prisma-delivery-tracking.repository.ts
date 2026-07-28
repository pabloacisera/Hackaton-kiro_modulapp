import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  DeliveryTracking,
  DeliveryStatus,
} from '../../../modules/deliveries/domain/delivery-item.entity';
import {
  IDeliveryTrackingRepository,
  ListDeliveryTrackingFilter,
  PaginatedDeliveryTracking,
} from '../../../modules/deliveries/repositories/delivery-tracking.repository.port';

@Injectable()
export class PrismaDeliveryTrackingRepository implements IDeliveryTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DeliveryTracking | null> {
    const row = await this.prisma.deliveryTracking.findUnique({
      where: { id },
      include: { order: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByOrderId(orderId: string): Promise<DeliveryTracking | null> {
    const row = await this.prisma.deliveryTracking.findUnique({
      where: { orderId },
      include: { order: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filter: ListDeliveryTrackingFilter): Promise<PaginatedDeliveryTracking> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      where.OR = [
        { order: { customerEmail: { contains: q, mode: 'insensitive' } } },
        { order: { customerName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.deliveryTracking.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { estimatedDeliveryDate: 'asc' },
        include: { order: true },
      }),
      this.prisma.deliveryTracking.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async save(tracking: DeliveryTracking): Promise<DeliveryTracking> {
    const props = tracking.toProps();
    const row = await this.prisma.deliveryTracking.create({
      data: {
        id: props.id,
        orderId: props.orderId,
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        status: props.status,
        deliveredAt: props.deliveredAt,
      },
      include: { order: true },
    });
    return this.toDomain(row);
  }

  async update(tracking: DeliveryTracking): Promise<DeliveryTracking> {
    const props = tracking.toProps();
    const row = await this.prisma.deliveryTracking.update({
      where: { id: props.id },
      data: {
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        status: props.status,
        deliveredAt: props.deliveredAt,
      },
      include: { order: true },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    orderId: string;
    estimatedDeliveryDate: Date;
    status: string;
    deliveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    order: {
      id: string;
      origin: string;
      customerName: string | null;
      customerEmail: string;
      quoteId: string | null;
    };
  }): DeliveryTracking {
    return new DeliveryTracking({
      id: row.id,
      orderId: row.orderId,
      customerName: row.order.customerName ?? row.order.customerEmail,
      customerEmail: row.order.customerEmail,
      origin: row.order.origin as 'order' | 'quote',
      quoteId: row.order.quoteId,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      status: row.status as DeliveryStatus,
      deliveredAt: row.deliveredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
