import { Supply } from '../domain/supply.entity';
import { SupplyStockChangeLog } from '../domain/stock-change-log.entity';
import { LowStockAlertState } from '../domain/low-stock-alert-state.entity';
import { ISupplyRepository, ListSuppliesFilter, PaginatedSupplies } from './supply.repository.port';

export class InMemorySupplyRepository implements ISupplyRepository {
  private supplies: Supply[] = [];
  private changeLogs: SupplyStockChangeLog[] = [];
  private alertStates: LowStockAlertState[] = [];

  async findById(id: string): Promise<Supply | null> {
    return this.supplies.find((s) => s.id === id) ?? null;
  }

  async findBySku(sku: string): Promise<Supply | null> {
    return this.supplies.find((s) => s.sku === sku.toUpperCase()) ?? null;
  }

  async findAll(filter: ListSuppliesFilter): Promise<PaginatedSupplies> {
    let items = [...this.supplies];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (s) => s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q),
      );
    }
    if (filter.supplier) {
      const sup = filter.supplier.toLowerCase();
      items = items.filter((s) => s.supplier?.toLowerCase().includes(sup));
    }
    if (filter.belowMin) {
      items = items.filter((s) => s.isBelowMinimum());
    }

    const total = items.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    items = items.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  async findBelowMinimum(): Promise<Supply[]> {
    return this.supplies.filter((s) => s.isBelowMinimum());
  }

  async save(supply: Supply): Promise<Supply> {
    this.supplies.push(supply);
    return supply;
  }

  async update(supply: Supply): Promise<Supply> {
    const idx = this.supplies.findIndex((s) => s.id === supply.id);
    if (idx === -1) throw new Error(`Supply not found: ${supply.id}`);
    this.supplies[idx] = supply;
    return supply;
  }

  async delete(id: string): Promise<void> {
    const idx = this.supplies.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Supply not found: ${id}`);
    this.supplies.splice(idx, 1);
  }

  async saveChangeLog(log: SupplyStockChangeLog): Promise<void> {
    this.changeLogs.push(log);
  }

  async findAlertState(supplyId: string): Promise<LowStockAlertState | null> {
    return this.alertStates.find((a) => a.supplyId === supplyId) ?? null;
  }

  async saveAlertState(state: LowStockAlertState): Promise<void> {
    this.alertStates.push(state);
  }

  async updateAlertState(state: LowStockAlertState): Promise<void> {
    const idx = this.alertStates.findIndex((a) => a.supplyId === state.supplyId);
    if (idx === -1) this.alertStates.push(state);
    else this.alertStates[idx] = state;
  }

  // Test helpers
  getChangeLogs(): SupplyStockChangeLog[] {
    return [...this.changeLogs];
  }

  clear(): void {
    this.supplies = [];
    this.changeLogs = [];
    this.alertStates = [];
  }
}
