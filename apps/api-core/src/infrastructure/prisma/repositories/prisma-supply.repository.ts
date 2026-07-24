import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Supply } from '../../../modules/supplies/domain/supply.entity';
import { SupplyStockChangeLog } from '../../../modules/supplies/domain/stock-change-log.entity';
import { LowStockAlertState } from '../../../modules/supplies/domain/low-stock-alert-state.entity';
import {
  ISupplyRepository,
  ListSuppliesFilter,
  PaginatedSupplies,
} from '../../../modules/supplies/repositories/supply.repository.port';

@Injectable()
export class PrismaSupplyRepository implements ISupplyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Supply | null> {
    const row = await this.prisma.supply.findUnique({ where: { id } });
    return row ? this.toSupplyDomain(row) : null;
  }

  async findBySku(sku: string): Promise<Supply | null> {
    const row = await this.prisma.supply.findUnique({ where: { sku } });
    return row ? this.toSupplyDomain(row) : null;
  }

  async findAll(filter: ListSuppliesFilter): Promise<PaginatedSupplies> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SupplyWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.supplier) {
      where.supplier = { contains: filter.supplier, mode: 'insensitive' };
    }
    if (filter.belowMin) {
      where.currentQty = { lt: this.prisma.$queryRawUnsafe('') as never };
      // Prisma doesn't support column comparison directly.
      // Use raw filter for below-minimum check.
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supply.findMany({
        where: filter.belowMin ? undefined : where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supply.count({ where: filter.belowMin ? undefined : where }),
    ]);

    let items = rows.map((r) => this.toSupplyDomain(r));

    // Filter below minimum in application layer (Prisma limitation for column comparison)
    if (filter.belowMin) {
      items = items.filter((s) => s.isBelowMinimum());
    }

    return { items, total: filter.belowMin ? items.length : total, page, pageSize };
  }

  async findBelowMinimum(): Promise<Supply[]> {
    // Use raw query for column-to-column comparison
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        unit: string;
        current_qty: Prisma.Decimal;
        min_stock: Prisma.Decimal;
        unit_cost_usd: Prisma.Decimal;
        supplier: string | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`SELECT * FROM supplies WHERE current_qty < min_stock`;

    return rows.map((r) => this.toSupplyDomainFromRaw(r));
  }

  async save(supply: Supply): Promise<Supply> {
    const props = supply.toProps();
    const row = await this.prisma.supply.create({
      data: {
        id: props.id,
        sku: props.sku,
        name: props.name,
        unit: props.unit,
        currentQty: props.currentQty,
        minStock: props.minStock,
        unitCostUsd: props.unitCostUsd,
        supplier: props.supplier,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
    });
    return this.toSupplyDomain(row);
  }

  async update(supply: Supply): Promise<Supply> {
    const props = supply.toProps();
    const row = await this.prisma.supply.update({
      where: { id: props.id },
      data: {
        sku: props.sku,
        name: props.name,
        unit: props.unit,
        currentQty: props.currentQty,
        minStock: props.minStock,
        unitCostUsd: props.unitCostUsd,
        supplier: props.supplier,
        updatedAt: props.updatedAt,
      },
    });
    return this.toSupplyDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.supply.delete({ where: { id } });
  }

  async saveChangeLog(log: SupplyStockChangeLog): Promise<void> {
    await this.prisma.supplyStockChangeLog.create({
      data: {
        id: log.id,
        supplyId: log.supplyId,
        previousQty: log.previousQty,
        newQty: log.newQty,
        source: log.source,
        actor: log.actor,
        createdAt: log.createdAt,
      },
    });
  }

  async findAlertState(supplyId: string): Promise<LowStockAlertState | null> {
    const row = await this.prisma.lowStockAlertState.findUnique({
      where: { supplyId },
    });
    if (!row) return null;
    return new LowStockAlertState({
      id: row.id,
      supplyId: row.supplyId,
      lastNotifiedAt: row.lastNotifiedAt,
      lastNotifiedQty: row.lastNotifiedQty.toNumber(),
    });
  }

  async saveAlertState(state: LowStockAlertState): Promise<void> {
    const props = state.toProps();
    await this.prisma.lowStockAlertState.create({
      data: {
        id: props.id,
        supplyId: props.supplyId,
        lastNotifiedAt: props.lastNotifiedAt,
        lastNotifiedQty: props.lastNotifiedQty,
      },
    });
  }

  async updateAlertState(state: LowStockAlertState): Promise<void> {
    const props = state.toProps();
    await this.prisma.lowStockAlertState.update({
      where: { supplyId: props.supplyId },
      data: {
        lastNotifiedAt: props.lastNotifiedAt,
        lastNotifiedQty: props.lastNotifiedQty,
      },
    });
  }

  private toSupplyDomain(row: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    currentQty: Prisma.Decimal;
    minStock: Prisma.Decimal;
    unitCostUsd: Prisma.Decimal;
    supplier: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Supply {
    return new Supply({
      id: row.id,
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      currentQty: row.currentQty.toNumber(),
      minStock: row.minStock.toNumber(),
      unitCostUsd: row.unitCostUsd.toNumber(),
      supplier: row.supplier,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toSupplyDomainFromRaw(row: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    current_qty: Prisma.Decimal;
    min_stock: Prisma.Decimal;
    unit_cost_usd: Prisma.Decimal;
    supplier: string | null;
    created_at: Date;
    updated_at: Date;
  }): Supply {
    return new Supply({
      id: row.id,
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      currentQty: Number(row.current_qty),
      minStock: Number(row.min_stock),
      unitCostUsd: Number(row.unit_cost_usd),
      supplier: row.supplier,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
