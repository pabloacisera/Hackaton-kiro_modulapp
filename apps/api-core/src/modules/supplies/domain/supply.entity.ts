/**
 * TASK-stock-1: Supply domain entity with business invariants.
 * - current_qty cannot be negative
 * - min_stock cannot be negative
 * - unit_cost_usd cannot be negative
 * - SKU is required and unique (enforced at DB level)
 */

export interface SupplyProps {
  id: string;
  sku: string;
  name: string;
  unit: string;
  currentQty: number;
  minStock: number;
  unitCostUsd: number;
  supplier: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Supply {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly currentQty: number;
  readonly minStock: number;
  readonly unitCostUsd: number;
  readonly supplier: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: SupplyProps) {
    if (props.currentQty < 0) {
      throw new Error('Current quantity cannot be negative');
    }
    if (props.minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }
    if (props.unitCostUsd < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    if (!props.sku || props.sku.trim().length === 0) {
      throw new Error('SKU is required');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    Object.assign(this, props);
  }

  /** Check if supply is below minimum stock */
  isBelowMinimum(): boolean {
    return this.currentQty < this.minStock;
  }

  /** Update quantity — returns new Supply instance */
  updateQuantity(newQty: number): Supply {
    return new Supply({
      ...this.toProps(),
      currentQty: newQty,
      updatedAt: new Date(),
    });
  }

  /** Update supply fields — returns new Supply instance */
  update(patch: Partial<Omit<SupplyProps, 'id' | 'createdAt'>>): Supply {
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined),
    );
    return new Supply({
      ...this.toProps(),
      ...(cleanPatch as Partial<Omit<SupplyProps, 'id' | 'createdAt'>>),
      updatedAt: new Date(),
    });
  }

  static create(
    sku: string,
    name: string,
    unit: string,
    currentQty: number,
    minStock: number,
    unitCostUsd: number,
    supplier: string | null,
  ): Supply {
    return new Supply({
      id: crypto.randomUUID(),
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      unit: unit.trim(),
      currentQty,
      minStock,
      unitCostUsd,
      supplier: supplier?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  toProps(): SupplyProps {
    return {
      id: this.id,
      sku: this.sku,
      name: this.name,
      unit: this.unit,
      currentQty: this.currentQty,
      minStock: this.minStock,
      unitCostUsd: this.unitCostUsd,
      supplier: this.supplier,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
