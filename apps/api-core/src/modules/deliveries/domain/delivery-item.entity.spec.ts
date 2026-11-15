import { DeliveryTracking } from './delivery-item.entity';

describe('DeliveryTracking', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  function createPending(): DeliveryTracking {
    return new DeliveryTracking({
      id: 'del-1',
      orderId: 'order-1',
      origin: 'order',
      customerName: 'Ana',
      customerEmail: 'ana@test.com',
      quoteId: null,
      estimatedDeliveryDate: futureDate,
      status: 'pending',
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  describe('isOverdue', () => {
    it('returns false when delivered', () => {
      expect(DeliveryTracking.isOverdue(pastDate, new Date())).toBe(false);
    });

    it('returns true when past deadline and not delivered', () => {
      expect(DeliveryTracking.isOverdue(pastDate, null)).toBe(true);
    });

    it('returns false when before deadline and not delivered', () => {
      expect(DeliveryTracking.isOverdue(futureDate, null)).toBe(false);
    });
  });

  describe('deliver()', () => {
    it('sets deliveredAt and status to delivered', () => {
      const item = createPending();
      const delivered = item.deliver();
      expect(delivered.status).toBe('delivered');
      expect(delivered.deliveredAt).toBeInstanceOf(Date);
    });

    it('throws if already delivered', () => {
      const item = createPending().deliver();
      expect(() => item.deliver()).toThrow('Already delivered');
    });
  });

  describe('postpone()', () => {
    it('updates estimatedDeliveryDate', () => {
      const item = createPending();
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const postponed = item.postpone(newDate);
      expect(postponed.estimatedDeliveryDate).toEqual(newDate);
      expect(postponed.status).toBe('pending');
    });

    it('throws if already delivered', () => {
      const item = createPending().deliver();
      expect(() => item.postpone(futureDate)).toThrow('Cannot postpone: already delivered');
    });

    it('throws if new date is in the past', () => {
      const item = createPending();
      expect(() => item.postpone(pastDate)).toThrow('New delivery date must be in the future');
    });
  });
});
