import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Order, OrderStatus } from '../../../modules/orders/domain/order.entity';
import {
  IOrderRepository,
  ListOrdersFilter,
  PaginatedOrders,
} from '../../../modules/orders/repositories/order.repository.port';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { idempotencyKey: key },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByPaymentServiceRef(ref: string): Promise<Order | null> {
    const row = await this.prisma.order.findFirst({
      where: { paymentServiceRef: ref },
    });
    return row ? this.toDomain(row) : null;
  }

  async findHungPayments(olderThanMinutes: number): Promise<Order[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const rows = await this.prisma.order.findMany({
      where: {
        status: 'payment_initiated',
        updatedAt: { lt: cutoff },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(filter: ListOrdersFilter): Promise<PaginatedOrders> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.q) {
      where.OR = [
        { customerEmail: { contains: filter.q, mode: 'insensitive' } },
        { customerName: { contains: filter.q, mode: 'insensitive' } },
        { id: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async save(order: Order): Promise<Order> {
    const props = order.toProps();
    const row = await this.prisma.order.create({
      data: {
        id: props.id,
        prototypeId: props.prototypeId,
        priceUsdSnapshot: props.priceUsdSnapshot,
        customerEmail: props.customerEmail,
        customerName: props.customerName,
        status: props.status,
        rejectionReason: props.rejectionReason,
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        paymentServiceRef: props.paymentServiceRef,
        idempotencyKey: props.idempotencyKey,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async update(order: Order): Promise<Order> {
    const props = order.toProps();
    const row = await this.prisma.order.update({
      where: { id: props.id },
      data: {
        status: props.status,
        rejectionReason: props.rejectionReason,
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        paymentServiceRef: props.paymentServiceRef,
        updatedAt: props.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    prototypeId: string;
    priceUsdSnapshot: Prisma.Decimal;
    customerEmail: string;
    customerName: string | null;
    status: string;
    rejectionReason: string | null;
    estimatedDeliveryDate: Date | null;
    paymentServiceRef: string | null;
    idempotencyKey: string;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return new Order({
      id: row.id,
      prototypeId: row.prototypeId,
      priceUsdSnapshot: row.priceUsdSnapshot.toNumber(),
      customerEmail: row.customerEmail,
      customerName: row.customerName,
      status: row.status as OrderStatus,
      rejectionReason: row.rejectionReason,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      paymentServiceRef: row.paymentServiceRef,
      idempotencyKey: row.idempotencyKey,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
