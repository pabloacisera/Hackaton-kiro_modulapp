import { Supply } from '../domain/supply.entity';
import { SupplyStockChangeLog } from '../domain/stock-change-log.entity';
import { LowStockAlertState } from '../domain/low-stock-alert-state.entity';

export interface ListSuppliesFilter {
  search?: string;
  supplier?: string;
  belowMin?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSupplies {
  items: Supply[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ISupplyRepository {
  findById(id: string): Promise<Supply | null>;
  findBySku(sku: string): Promise<Supply | null>;
  findAll(filter: ListSuppliesFilter): Promise<PaginatedSupplies>;
  findBelowMinimum(): Promise<Supply[]>;
  save(supply: Supply): Promise<Supply>;
  update(supply: Supply): Promise<Supply>;
  delete(id: string): Promise<void>;
  saveChangeLog(log: SupplyStockChangeLog): Promise<void>;
  findAlertState(supplyId: string): Promise<LowStockAlertState | null>;
  saveAlertState(state: LowStockAlertState): Promise<void>;
  updateAlertState(state: LowStockAlertState): Promise<void>;
}

export const SUPPLY_REPOSITORY = Symbol('ISupplyRepository');
