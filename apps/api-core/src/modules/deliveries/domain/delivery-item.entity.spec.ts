import { DeliveryItem } from './delivery-item.entity';

describe('DeliveryItem', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  function createPending(): DeliveryItem {
    return new DeliveryItem({
      id: 'del-1',
      origin: 'order',
      customerName: 'Ana',
      customerEmail: 'ana@test.com',
      estimatedDeliveryDate: futureDate,
      status: 'pending',
      deliveredAt: null,
    });
  }

  describe('calculateStatus', () => {
    it('returns delivered when deliveredAt is set', () => {
      expect(DeliveryItem.calculateStatus(futureDate, new Date())).toBe('delivered');
    });

    it('returns overdue when past deadline and not delivered', () => {
      expect(DeliveryItem.calculateStatus(pastDate, null)).toBe('overdue');
    });

    it('returns pending when before deadline and not delivered', () => {
      expect(DeliveryItem.calculateStatus(futureDate, null)).toBe('pending');
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
