import { Injectable, Inject } from '@nestjs/common';
import { Supply } from '../domain/supply.entity';
import { SupplyStockChangeLog } from '../domain/stock-change-log.entity';
import {
  ISupplyRepository,
  SUPPLY_REPOSITORY,
  ListSuppliesFilter,
  PaginatedSupplies,
} from '../repositories/supply.repository.port';

export interface CreateSupplyInput {
  sku: string;
  name: string;
  unit: string;
  currentQty: number;
  minStock: number;
  unitCostUsd: number;
  supplier?: string | null;
}

export interface UpdateSupplyInput {
  name?: string;
  unit?: string;
  currentQty?: number;
  minStock?: number;
  unitCostUsd?: number;
  supplier?: string | null;
}

/**
 * TASK-stock-2: CRUD use cases for supplies.
 * Both manual panel editing and Excel import use these same methods.
 */
@Injectable()
export class SupplyCrudUseCase {
  constructor(@Inject(SUPPLY_REPOSITORY) private readonly repo: ISupplyRepository) {}

  async create(input: CreateSupplyInput, actor: string): Promise<Supply> {
    const existing = await this.repo.findBySku(input.sku);
    if (existing) {
      throw new Error(`Supply with SKU '${input.sku.toUpperCase()}' already exists`);
    }

    const supply = Supply.create(
      input.sku,
      input.name,
      input.unit,
      input.currentQty,
      input.minStock,
      input.unitCostUsd,
      input.supplier ?? null,
    );
    await this.repo.save(supply);

    // Log initial stock
    const log = SupplyStockChangeLog.create(supply.id, 0, supply.currentQty, 'manual', actor);
    await this.repo.saveChangeLog(log);

    return supply;
  }

  async update(
    id: string,
    input: UpdateSupplyInput,
    actor: string,
    source: 'manual' | 'excel_import' = 'manual',
  ): Promise<Supply> {
    const supply = await this.repo.findById(id);
    if (!supply) throw new Error(`Supply not found: ${id}`);

    const previousQty = supply.currentQty;
    const updated = supply.update(input);
    await this.repo.update(updated);

    // Log quantity change if it changed
    if (input.currentQty !== undefined && input.currentQty !== previousQty) {
      const log = SupplyStockChangeLog.create(
        supply.id,
        previousQty,
        input.currentQty,
        source,
        actor,
      );
      await this.repo.saveChangeLog(log);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findById(id: string): Promise<Supply | null> {
    return this.repo.findById(id);
  }

  async list(filter: ListSuppliesFilter): Promise<PaginatedSupplies> {
    return this.repo.findAll(filter);
  }
}
