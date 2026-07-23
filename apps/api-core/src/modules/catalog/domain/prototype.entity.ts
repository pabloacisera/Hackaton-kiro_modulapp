/**
 * TASK-catalog-1: Prototype domain entity with business invariants.
 *
 * Invariants:
 *  - active implies visible (deactivated prototypes are never shown to customers)
 *  - stockQty >= 0 at all times
 *  - buildOnDemand=true allows purchase even when stockQty === 0
 */
export interface ProtoImageProps {
  id: string;
  url: string;
  order: number;
}

export interface PrototypeProps {
  id: string;
  name: string;
  description: string;
  category: 'modular_furniture' | 'arches';
  priceUsd: number;
  active: boolean;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays: number | null;
  images: ProtoImageProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class Prototype {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'modular_furniture' | 'arches';
  readonly priceUsd: number;
  readonly active: boolean;
  readonly stockQty: number;
  readonly buildOnDemand: boolean;
  readonly estimatedDeliveryDays: number | null;
  readonly images: ProtoImageProps[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PrototypeProps) {
    // ── Invariant: stock cannot be negative ───────────────────────────────
    if (props.stockQty < 0) {
      throw new Error('stockQty cannot be negative');
    }
    Object.assign(this, props);
  }

  /** Whether this prototype can be purchased right now. */
  get isPurchasable(): boolean {
    if (!this.active) return false;
    if (this.buildOnDemand) return true;
    return this.stockQty > 0;
  }

  /** Whether this prototype is visible in the catalog. Active implies visible. */
  get isVisible(): boolean {
    return this.active;
  }

  deactivate(): Prototype {
    return new Prototype({ ...this.toProps(), active: false });
  }

  updatePrice(newPrice: number): Prototype {
    if (newPrice <= 0) throw new Error('Price must be positive');
    return new Prototype({ ...this.toProps(), priceUsd: newPrice });
  }

  deductStock(qty: number): Prototype {
    const newQty = this.stockQty - qty;
    if (newQty < 0) throw new Error('Insufficient stock');
    return new Prototype({ ...this.toProps(), stockQty: newQty });
  }

  toProps(): PrototypeProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      priceUsd: this.priceUsd,
      active: this.active,
      stockQty: this.stockQty,
      buildOnDemand: this.buildOnDemand,
      estimatedDeliveryDays: this.estimatedDeliveryDays,
      images: this.images,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
