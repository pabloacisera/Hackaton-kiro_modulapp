import { Complaint } from './complaint.entity';

describe('Complaint Entity — State Machine', () => {
  function createReceived(): Complaint {
    return Complaint.create(
      'order',
      'ord-123',
      'Ana',
      'ana@test.com',
      '+54 11 555',
      'Product defective',
    );
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a complaint in received status', () => {
      const c = createReceived();
      expect(c.status).toBe('received');
      expect(c.referenceType).toBe('order');
      expect(c.customerEmail).toBe('ana@test.com');
    });

    it('creates with unknown reference type', () => {
      const c = Complaint.create('unknown', null, 'Bob', 'bob@test.com', null, 'Lost order');
      expect(c.referenceType).toBe('unknown');
      expect(c.referenceId).toBeNull();
    });

    it('throws when name is missing', () => {
      expect(() => Complaint.create('order', 'o-1', '', 'a@b.com', null, 'reason')).toThrow(
        'Customer name is required',
      );
    });

    it('throws when email is invalid', () => {
      expect(() => Complaint.create('order', 'o-1', 'Ana', 'bad', null, 'reason')).toThrow(
        'Valid customer email is required',
      );
    });

    it('throws when reason is missing', () => {
      expect(() => Complaint.create('order', 'o-1', 'Ana', 'a@b.com', null, '')).toThrow(
        'Reason is required',
      );
    });
  });

  // ── Valid transitions ──────────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('received → under_review', () => {
      const c = createReceived().markUnderReview();
      expect(c.status).toBe('under_review');
    });

    it('under_review → refund_approved', () => {
      const c = createReceived().markUnderReview().approveRefund('REF-001');
      expect(c.status).toBe('refund_approved');
      expect(c.refundRequestId).toBe('REF-001');
      expect(c.resolvedAt).toBeInstanceOf(Date);
    });

    it('under_review → resolved_other_way', () => {
      const c = createReceived()
        .markUnderReview()
        .resolve('Replaced product', 'resolved_other_way');
      expect(c.status).toBe('resolved_other_way');
      expect(c.resolutionNotes).toBe('Replaced product');
    });

    it('under_review → rejected', () => {
      const c = createReceived().markUnderReview().resolve('Not eligible', 'rejected');
      expect(c.status).toBe('rejected');
    });
  });

  // ── Invalid transitions ────────────────────────────────────────────────────

  describe('invalid transitions', () => {
    it('received → refund_approved throws (must review first)', () => {
      expect(() => createReceived().approveRefund('REF-X')).toThrow('Invalid transition');
    });

    it('received → resolved throws', () => {
      expect(() => createReceived().resolve('notes', 'resolved_other_way')).toThrow(
        'Invalid transition',
      );
    });

    it('refund_approved → anything throws (terminal)', () => {
      const c = createReceived().markUnderReview().approveRefund('REF-1');
      expect(() => c.markUnderReview()).toThrow('Invalid transition');
      expect(() => c.resolve('x', 'rejected')).toThrow('Invalid transition');
    });

    it('rejected → anything throws (terminal)', () => {
      const c = createReceived().markUnderReview().resolve('No', 'rejected');
      expect(() => c.markUnderReview()).toThrow('Invalid transition');
    });
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  describe('guards', () => {
    it('approveRefund throws for unknown reference type', () => {
      const c = Complaint.create(
        'unknown',
        null,
        'Bob',
        'b@b.com',
        null,
        'reason',
      ).markUnderReview();
      expect(() => c.approveRefund('REF-X')).toThrow(
        'Cannot approve refund: no valid payment reference',
      );
    });

    it('approveRefund throws when referenceId is null', () => {
      const c = Complaint.create('order', null, 'Bob', 'b@b.com', null, 'reason').markUnderReview();
      expect(() => c.approveRefund('REF-X')).toThrow(
        'Cannot approve refund: no valid payment reference',
      );
    });

    it('approveRefund throws when refundRequestId is empty', () => {
      const c = createReceived().markUnderReview();
      expect(() => c.approveRefund('')).toThrow('Refund request ID is required');
    });

    it('resolve throws when notes are empty', () => {
      const c = createReceived().markUnderReview();
      expect(() => c.resolve('', 'rejected')).toThrow('Resolution notes are required');
    });
  });
});
