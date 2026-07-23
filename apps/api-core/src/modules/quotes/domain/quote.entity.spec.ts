import { Quote } from './quote.entity';

describe('Quote Entity — State Machine', () => {
  const validProps = {
    customerName: 'María García',
    customerEmail: 'maria@example.com',
    customerPhone: '+54 11 5555-1234',
    description: 'Custom arch for wedding, 3m wide, flowers theme',
    neededByDate: new Date('2026-09-01'),
  };

  function createPendingQuote(): Quote {
    return Quote.create(
      validProps.customerName,
      validProps.customerEmail,
      validProps.customerPhone,
      validProps.description,
      validProps.neededByDate,
    );
  }

  function createQuotedQuote(): Quote {
    const q = createPendingQuote();
    return q.presentQuote(150.0, 7, new Date('2026-08-20'), 'hashed_token_123');
  }

  function createAcceptedQuote(): Quote {
    const q = createQuotedQuote();
    return q.accept();
  }

  // ── Factory tests ──────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a quote in pending status with valid data', () => {
      const quote = createPendingQuote();
      expect(quote.status).toBe('pending');
      expect(quote.customerName).toBe('María García');
      expect(quote.customerEmail).toBe('maria@example.com');
      expect(quote.customerPhone).toBe('+54 11 5555-1234');
      expect(quote.id).toBeDefined();
    });

    it('trims and lowercases email', () => {
      const quote = Quote.create('Test', '  UPPER@CASE.COM  ', '123', 'desc', new Date());
      expect(quote.customerEmail).toBe('upper@case.com');
    });

    it('throws when name is missing', () => {
      expect(() => Quote.create('', 'a@b.com', '123', 'desc', new Date())).toThrow(
        'Customer name is required',
      );
    });

    it('throws when email is invalid', () => {
      expect(() => Quote.create('Name', 'not-an-email', '123', 'desc', new Date())).toThrow(
        'Customer email is required and must be valid',
      );
    });

    it('throws when phone is missing', () => {
      expect(() => Quote.create('Name', 'a@b.com', '', 'desc', new Date())).toThrow(
        'Customer phone is required',
      );
    });

    it('throws when description is missing', () => {
      expect(() => Quote.create('Name', 'a@b.com', '123', '', new Date())).toThrow(
        'Description is required',
      );
    });
  });

  describe('createDiscarded()', () => {
    it('creates a discarded quote with rejection reason', () => {
      const quote = Quote.createDiscarded(
        null,
        'partial@mail.com',
        null,
        'some desc',
        null,
        'Missing name and phone',
      );
      expect(quote.status).toBe('discarded_incomplete_data');
      expect(quote.rejectionReason).toBe('Missing name and phone');
    });
  });

  // ── Valid transitions ──────────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('pending → quoted (presentQuote)', () => {
      const quote = createPendingQuote();
      const quoted = quote.presentQuote(200.0, 10, new Date('2026-09-15'), 'token_hash_abc');
      expect(quoted.status).toBe('quoted');
      expect(quoted.quotedPriceUsd).toBe(200.0);
      expect(quoted.quotedLeadTimeDays).toBe(10);
      expect(quoted.quoteSentAt).toBeInstanceOf(Date);
      expect(quoted.quoteResponseDeadline).toBeInstanceOf(Date);
      expect(quoted.actionTokenHash).toBe('token_hash_abc');
      expect(quoted.actionTokenUsed).toBe(false);
    });

    it('quoted → accepted (accept)', () => {
      const quoted = createQuotedQuote();
      const accepted = quoted.accept();
      expect(accepted.status).toBe('accepted');
      expect(accepted.acceptedAt).toBeInstanceOf(Date);
      expect(accepted.actionTokenUsed).toBe(true);
      expect(accepted.paymentDeadline).toBeInstanceOf(Date);
    });

    it('quoted → rejected (reject)', () => {
      const quoted = createQuotedQuote();
      const rejected = quoted.reject();
      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectedAt).toBeInstanceOf(Date);
      expect(rejected.actionTokenUsed).toBe(true);
    });

    it('quoted → expired (expire)', () => {
      const quoted = createQuotedQuote();
      const expired = quoted.expire();
      expect(expired.status).toBe('expired');
    });

    it('accepted → payment_initiated (initiatePayment)', () => {
      const accepted = createAcceptedQuote();
      const initiated = accepted.initiatePayment('PAY-REF-123');
      expect(initiated.status).toBe('payment_initiated');
      expect(initiated.paymentServiceRef).toBe('PAY-REF-123');
    });

    it('payment_initiated → paid (confirmPayment)', () => {
      const initiated = createAcceptedQuote().initiatePayment('PAY-REF-123');
      const paid = initiated.confirmPayment();
      expect(paid.status).toBe('paid');
      expect(paid.paidAt).toBeInstanceOf(Date);
    });

    it('payment_initiated → payment_expired (expirePayment)', () => {
      const initiated = createAcceptedQuote().initiatePayment('PAY-REF-123');
      const expired = initiated.expirePayment();
      expect(expired.status).toBe('payment_expired');
    });

    it('rejected → archived (archive)', () => {
      const rejected = createQuotedQuote().reject();
      const archived = rejected.archive();
      expect(archived.status).toBe('archived');
    });

    it('expired → archived (archive)', () => {
      const expired = createQuotedQuote().expire();
      const archived = expired.archive();
      expect(archived.status).toBe('archived');
    });

    it('payment_expired → archived (archive)', () => {
      const payExpired = createAcceptedQuote().initiatePayment('REF').expirePayment();
      const archived = payExpired.archive();
      expect(archived.status).toBe('archived');
    });
  });

  // ── Invalid transitions ────────────────────────────────────────────────────

  describe('invalid transitions blocked', () => {
    it('pending → accepted throws', () => {
      const quote = createPendingQuote();
      expect(() => quote.accept()).toThrow('Invalid transition');
    });

    it('pending → rejected throws', () => {
      const quote = createPendingQuote();
      expect(() => quote.reject()).toThrow('Invalid transition');
    });

    it('quoted → paid throws (must go through accepted + payment_initiated)', () => {
      const quoted = createQuotedQuote();
      expect(() => quoted.confirmPayment()).toThrow('Invalid transition');
    });

    it('accepted → paid throws (must go through payment_initiated)', () => {
      const accepted = createAcceptedQuote();
      expect(() => accepted.confirmPayment()).toThrow('Invalid transition');
    });

    it('paid → anything throws (terminal state)', () => {
      const paid = createAcceptedQuote().initiatePayment('REF').confirmPayment();
      expect(() => paid.archive()).toThrow('Invalid transition');
      expect(() => paid.expire()).toThrow('Invalid transition');
    });

    it('discarded_incomplete_data → anything throws (terminal state)', () => {
      const discarded = Quote.createDiscarded(null, null, null, null, null, 'all missing');
      expect(() => discarded.presentQuote(100, 5, new Date(), 'h')).toThrow('Invalid transition');
    });

    it('archived → anything throws (terminal state)', () => {
      const archived = createQuotedQuote().reject().archive();
      expect(() => archived.expire()).toThrow('Invalid transition');
    });
  });

  // ── Guard validations ──────────────────────────────────────────────────────

  describe('guard validations', () => {
    it('presentQuote throws if price <= 0', () => {
      const quote = createPendingQuote();
      expect(() => quote.presentQuote(0, 5, new Date(), 'hash')).toThrow(
        'Quoted price must be positive',
      );
    });

    it('presentQuote throws if leadTimeDays <= 0', () => {
      const quote = createPendingQuote();
      expect(() => quote.presentQuote(100, 0, new Date(), 'hash')).toThrow(
        'Lead time days must be positive',
      );
    });

    it('accept throws if token already used', () => {
      const quoted = createQuotedQuote();
      const accepted = quoted.accept();
      // Recreate a "quoted" with tokenUsed = true to simulate double-click
      const fakeDoubleClick = new Quote({
        ...accepted.toProps(),
        status: 'quoted',
      });
      expect(() => fakeDoubleClick.accept()).toThrow('Action token has already been used');
    });

    it('reject throws if token already used', () => {
      const quoted = createQuotedQuote();
      const rejected = quoted.reject();
      const fakeDoubleClick = new Quote({
        ...rejected.toProps(),
        status: 'quoted',
      });
      expect(() => fakeDoubleClick.reject()).toThrow('Action token has already been used');
    });

    it('initiatePayment throws if paymentServiceRef is empty', () => {
      const accepted = createAcceptedQuote();
      expect(() => accepted.initiatePayment('')).toThrow('Payment service reference is required');
    });
  });

  // ── Deadline checks ────────────────────────────────────────────────────────

  describe('deadline checks', () => {
    it('isResponseExpired returns false before deadline', () => {
      const quoted = createQuotedQuote();
      expect(quoted.isResponseExpired(new Date())).toBe(false);
    });

    it('isResponseExpired returns true after 48h', () => {
      const quoted = createQuotedQuote();
      const after48h = new Date(quoted.quoteResponseDeadline!.getTime() + 1000);
      expect(quoted.isResponseExpired(after48h)).toBe(true);
    });

    it('isPaymentExpired returns false before deadline', () => {
      const accepted = createAcceptedQuote();
      expect(accepted.isPaymentExpired(new Date())).toBe(false);
    });

    it('isPaymentExpired returns true after 24h', () => {
      const accepted = createAcceptedQuote();
      const after24h = new Date(accepted.paymentDeadline!.getTime() + 1000);
      expect(accepted.isPaymentExpired(after24h)).toBe(true);
    });

    it('isResponseExpired returns false when no deadline set', () => {
      const quote = createPendingQuote();
      expect(quote.isResponseExpired()).toBe(false);
    });

    it('isPaymentExpired returns false when no deadline set', () => {
      const quote = createPendingQuote();
      expect(quote.isPaymentExpired()).toBe(false);
    });
  });

  // ── Immutability ───────────────────────────────────────────────────────────

  describe('immutability', () => {
    it('transitions return new instances, original is unchanged', () => {
      const pending = createPendingQuote();
      const quoted = pending.presentQuote(100, 5, new Date(), 'hash');
      expect(pending.status).toBe('pending');
      expect(quoted.status).toBe('quoted');
      expect(pending).not.toBe(quoted);
    });
  });
});
