import { Prototype } from './prototype.entity';

const base = {
  id: 'proto-1',
  name: 'Test Arch',
  description: 'A beautiful arch',
  category: 'arches' as const,
  priceUsd: 299.99,
  active: true,
  stockQty: 5,
  buildOnDemand: false,
  estimatedDeliveryDays: 14,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Prototype entity', () => {
  it('activeImpliesVisible — active=true → isVisible=true', () => {
    const p = new Prototype({ ...base, active: true });
    expect(p.isVisible).toBe(true);
  });

  it('activeImpliesVisible — active=false → isVisible=false', () => {
    const p = new Prototype({ ...base, active: false });
    expect(p.isVisible).toBe(false);
  });

  it('stockQtyCannotBeNegative — throws on negative stockQty', () => {
    expect(() => new Prototype({ ...base, stockQty: -1 }))
      .toThrow('stockQty cannot be negative');
  });

  it('buildOnDemandAllowsZeroStock — buildOnDemand=true + stockQty=0 → isPurchasable=true', () => {
    const p = new Prototype({ ...base, stockQty: 0, buildOnDemand: true });
    expect(p.isPurchasable).toBe(true);
  });

  it('deactivate returns new instance with active=false', () => {
    const p = new Prototype(base);
    const deactivated = p.deactivate();
    expect(deactivated.active).toBe(false);
    expect(p.active).toBe(true); // original unchanged
  });

  it('deductStock reduces stockQty correctly', () => {
    const p = new Prototype({ ...base, stockQty: 5 });
    const updated = p.deductStock(3);
    expect(updated.stockQty).toBe(2);
  });

  it('deductStock throws on insufficient stock', () => {
    const p = new Prototype({ ...base, stockQty: 2 });
    expect(() => p.deductStock(3)).toThrow('Insufficient stock');
  });
});
