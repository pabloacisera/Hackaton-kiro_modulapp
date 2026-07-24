import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Prototype, ProtoImageProps } from '../../../modules/catalog/domain/prototype.entity';
import {
  IPrototypeRepository,
  ListPrototypesFilter,
  AdminListPrototypesFilter,
  PaginatedPrototypes,
} from '../../../modules/catalog/repositories/prototype.repository.port';

@Injectable()
export class PrismaPrototypeRepository implements IPrototypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ListPrototypesFilter): Promise<PaginatedPrototypes> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PrototypeWhereInput = { active: true };

    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.q) {
      where.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    if (filter.minPrice !== undefined) {
      where.priceUsd = { ...(where.priceUsd as object), gte: filter.minPrice };
    }
    if (filter.maxPrice !== undefined) {
      where.priceUsd = { ...(where.priceUsd as object), lte: filter.maxPrice };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.prototype.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prototype.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async findAllAdmin(filter: AdminListPrototypesFilter): Promise<PaginatedPrototypes> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PrototypeWhereInput = {};

    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.q) {
      where.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.prototype.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prototype.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<Prototype | null> {
    const row = await this.prisma.prototype.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(prototype: Prototype): Promise<Prototype> {
    const props = prototype.toProps();
    const row = await this.prisma.prototype.upsert({
      where: { id: props.id },
      create: {
        id: props.id,
        name: props.name,
        description: props.description,
        category: props.category,
        priceUsd: props.priceUsd,
        active: props.active,
        stockQty: props.stockQty,
        buildOnDemand: props.buildOnDemand,
        estimatedDeliveryDays: props.estimatedDeliveryDays,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        images: {
          create: props.images.map((img) => ({
            id: img.id,
            url: img.url,
            order: img.order,
          })),
        },
      },
      update: {
        name: props.name,
        description: props.description,
        category: props.category,
        priceUsd: props.priceUsd,
        active: props.active,
        stockQty: props.stockQty,
        buildOnDemand: props.buildOnDemand,
        estimatedDeliveryDays: props.estimatedDeliveryDays,
        updatedAt: props.updatedAt,
        images: {
          deleteMany: {},
          create: props.images.map((img) => ({
            id: img.id,
            url: img.url,
            order: img.order,
          })),
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    name: string;
    description: string;
    category: string;
    priceUsd: Prisma.Decimal;
    active: boolean;
    stockQty: number;
    buildOnDemand: boolean;
    estimatedDeliveryDays: number | null;
    createdAt: Date;
    updatedAt: Date;
    images: { id: string; url: string; order: number }[];
  }): Prototype {
    const images: ProtoImageProps[] = row.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
    }));
    return new Prototype({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category as 'modular_furniture' | 'arches',
      priceUsd: row.priceUsd.toNumber(),
      active: row.active,
      stockQty: row.stockQty,
      buildOnDemand: row.buildOnDemand,
      estimatedDeliveryDays: row.estimatedDeliveryDays,
      images,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
