import { Supply } from './supply.entity';
import { LowStockAlertState } from './low-stock-alert-state.entity';

describe('Supply Entity', () => {
  it('creates a valid supply', () => {
    const supply = Supply.create('MDF-001', 'MDF Board 18mm', 'm2', 50, 10, 12.5, 'AcmeLumber');
    expect(supply.sku).toBe('MDF-001');
    expect(supply.name).toBe('MDF Board 18mm');
    expect(supply.currentQty).toBe(50);
    expect(supply.isBelowMinimum()).toBe(false);
  });

  it('accepts currentQty = 0', () => {
    const supply = Supply.create('MDF-002', 'Panel', 'unit', 0, 5, 10, null);
    expect(supply.currentQty).toBe(0);
  });

  it('throws when currentQty < 0', () => {
    expect(() => Supply.create('MDF-003', 'Panel', 'unit', -1, 5, 10, null)).toThrow(
      'Current quantity cannot be negative',
    );
  });

  it('throws when minStock < 0', () => {
    expect(() => Supply.create('MDF-004', 'Panel', 'unit', 10, -1, 10, null)).toThrow(
      'Minimum stock cannot be negative',
    );
  });

  it('throws when unitCostUsd < 0', () => {
    expect(() => Supply.create('MDF-005', 'Panel', 'unit', 10, 5, -1, null)).toThrow(
      'Unit cost cannot be negative',
    );
  });

  it('throws when SKU is empty', () => {
    expect(() => Supply.create('', 'Panel', 'unit', 10, 5, 10, null)).toThrow('SKU is required');
  });

  it('throws when name is empty', () => {
    expect(() => Supply.create('SKU-1', '', 'unit', 10, 5, 10, null)).toThrow('Name is required');
  });

  it('uppercases SKU', () => {
    const supply = Supply.create('mdf-lower', 'Panel', 'unit', 10, 5, 10, null);
    expect(supply.sku).toBe('MDF-LOWER');
  });

  it('isBelowMinimum returns true when qty < minStock', () => {
    const supply = Supply.create('SKU-A', 'Item', 'unit', 3, 10, 5, null);
    expect(supply.isBelowMinimum()).toBe(true);
  });

  it('updateQuantity returns new instance', () => {
    const supply = Supply.create('SKU-B', 'Item', 'unit', 10, 5, 5, null);
    const updated = supply.updateQuantity(3);
    expect(updated.currentQty).toBe(3);
    expect(supply.currentQty).toBe(10); // original unchanged
  });

  it('updateQuantity throws on negative', () => {
    const supply = Supply.create('SKU-C', 'Item', 'unit', 10, 5, 5, null);
    expect(() => supply.updateQuantity(-1)).toThrow('Current quantity cannot be negative');
  });

  it('update method patches fields', () => {
    const supply = Supply.create('SKU-D', 'Item', 'unit', 10, 5, 5, null);
    const updated = supply.update({ name: 'New Name', supplier: 'NewCo' });
    expect(updated.name).toBe('New Name');
    expect(updated.supplier).toBe('NewCo');
    expect(updated.sku).toBe('SKU-D'); // unchanged
  });
});

describe('LowStockAlertState', () => {
  it('notifies on first detection (createInitial)', () => {
    const state = LowStockAlertState.createInitial('s-1', 3);
    expect(state.supplyId).toBe('s-1');
    expect(state.lastNotifiedQty).toBe(3);
  });

  it('shouldNotify returns true when quantity worsened', () => {
    const state = LowStockAlertState.createInitial('s-1', 5);
    expect(state.shouldNotify(3)).toBe(true); // 3 < 5
  });

  it('shouldNotify returns false when unchanged and < 24h', () => {
    const state = LowStockAlertState.createInitial('s-1', 3);
    expect(state.shouldNotify(3)).toBe(false); // same qty, just created
  });

  it('shouldNotify returns true after 24h even if unchanged', () => {
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
    const state = new LowStockAlertState({
      id: 'a-1',
      supplyId: 's-1',
      lastNotifiedAt: past,
      lastNotifiedQty: 3,
    });
    expect(state.shouldNotify(3)).toBe(true);
  });

  it('shouldNotify returns false when improved (qty > lastNotifiedQty) and < 24h', () => {
    const state = LowStockAlertState.createInitial('s-1', 3);
    expect(state.shouldNotify(5)).toBe(false); // improved, not worsened
  });

  it('markNotified updates state', () => {
    const state = LowStockAlertState.createInitial('s-1', 5);
    const updated = state.markNotified(2);
    expect(updated.lastNotifiedQty).toBe(2);
    expect(updated.lastNotifiedAt.getTime()).toBeGreaterThanOrEqual(state.lastNotifiedAt.getTime());
  });
});
