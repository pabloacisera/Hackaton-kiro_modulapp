/**
 * TASK-quoteB-2: Quote domain entity with strict state machine.
 *
 * State machine:
 *   discarded_incomplete_data  (terminal — never visible for quoting)
 *   pending
 *     → quoted            (admin presented price + deadline)
 *         → accepted      (customer clicks "Accept" within 48h)
 *             → payment_initiated
 *                 → paid             (payment confirmed within 24h window)
 *                 → payment_expired  (24h passed without payment)
 *             → payment_initiated  (direct from accepted)
 *         → rejected      (customer clicks "Reject")
 *         → expired       (48h job: no response)
 *   rejected → archived   (manual admin action)
 *   expired → archived    (manual admin action)
 *   payment_expired → archived (manual admin action)
 *
 * All transitions are enforced here — invalid ones throw.
 */

export type QuoteStatus =
  | 'discarded_incomplete_data'
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'payment_initiated'
  | 'paid'
  | 'payment_expired'
  | 'archived';

export interface QuoteProps {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  neededByDate: Date;
  status: QuoteStatus;
  quotedPriceUsd: number | null;
  quotedLeadTimeDays: number | null;
  estimatedDeliveryDate: Date | null;
  quoteSentAt: Date | null;
  quoteResponseDeadline: Date | null;
  paymentDeadline: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  paidAt: Date | null;
  rejectionReason: string | null;
  actionTokenHash: string | null;
  actionTokenUsed: boolean;
  paymentServiceRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 48 hours in milliseconds */
const QUOTE_RESPONSE_WINDOW_MS = 48 * 60 * 60 * 1000;

/** 24 hours in milliseconds */
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Valid transitions map
const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  discarded_incomplete_data: [],
  pending: ['quoted'],
  quoted: ['accepted', 'rejected', 'expired'],
  accepted: ['payment_initiated'],
  rejected: ['archived'],
  expired: ['archived'],
  payment_initiated: ['paid', 'payment_expired'],
  paid: [],
  payment_expired: ['archived'],
  archived: [],
};

export class Quote {
  readonly id: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly description: string;
  readonly neededByDate: Date;
  readonly status: QuoteStatus;
  readonly quotedPriceUsd: number | null;
  readonly quotedLeadTimeDays: number | null;
  readonly estimatedDeliveryDate: Date | null;
  readonly quoteSentAt: Date | null;
  readonly quoteResponseDeadline: Date | null;
  readonly paymentDeadline: Date | null;
  readonly acceptedAt: Date | null;
  readonly rejectedAt: Date | null;
  readonly paidAt: Date | null;
  readonly rejectionReason: string | null;
  readonly actionTokenHash: string | null;
  readonly actionTokenUsed: boolean;
  readonly paymentServiceRef: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: QuoteProps) {
    Object.assign(this, props);
  }

  // ── State machine transitions ──────────────────────────────────────────────

  private transition(next: QuoteStatus, patch: Partial<QuoteProps> = {}): Quote {
    const allowed = ALLOWED_TRANSITIONS[this.status];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid transition: ${this.status} → ${next}. Allowed: [${allowed.join(', ')}]`,
      );
    }
    return new Quote({
      ...this.toProps(),
      ...patch,
      status: next,
      updatedAt: new Date(),
    });
  }

  /**
   * Admin presents a quote: price, lead time, and estimated delivery date.
   * Generates the 48h response window.
   */
  presentQuote(
    priceUsd: number,
    leadTimeDays: number,
    estimatedDeliveryDate: Date,
    actionTokenHash: string,
  ): Quote {
    if (priceUsd <= 0) {
      throw new Error('Quoted price must be positive');
    }
    if (leadTimeDays <= 0) {
      throw new Error('Lead time days must be positive');
    }
    const now = new Date();
    return this.transition('quoted', {
      quotedPriceUsd: priceUsd,
      quotedLeadTimeDays: leadTimeDays,
      estimatedDeliveryDate,
      quoteSentAt: now,
      quoteResponseDeadline: new Date(now.getTime() + QUOTE_RESPONSE_WINDOW_MS),
      actionTokenHash,
      actionTokenUsed: false,
    });
  }

  /**
   * Customer accepts the quote. Marks token as used.
   * Generates the 24h payment window.
   */
  accept(): Quote {
    if (this.actionTokenUsed) {
      throw new Error('Action token has already been used');
    }
    const now = new Date();
    return this.transition('accepted', {
      acceptedAt: now,
      actionTokenUsed: true,
      paymentDeadline: new Date(now.getTime() + PAYMENT_WINDOW_MS),
    });
  }

  /**
   * Customer rejects the quote. Marks token as used.
   */
  reject(): Quote {
    if (this.actionTokenUsed) {
      throw new Error('Action token has already been used');
    }
    return this.transition('rejected', {
      rejectedAt: new Date(),
      actionTokenUsed: true,
    });
  }

  /**
   * 48h expiration job marks the quote as expired (no response).
   */
  expire(): Quote {
    return this.transition('expired');
  }

  /**
   * Payment has been initiated with the payment service.
   */
  initiatePayment(paymentServiceRef: string): Quote {
    if (!paymentServiceRef) {
      throw new Error('Payment service reference is required');
    }
    return this.transition('payment_initiated', { paymentServiceRef });
  }

  /**
   * Payment confirmed by webhook within the 24h window.
   */
  confirmPayment(): Quote {
    return this.transition('paid', { paidAt: new Date() });
  }

  /**
   * 24h payment window expired without payment.
   */
  expirePayment(): Quote {
    return this.transition('payment_expired');
  }

  /**
   * Admin archives a rejected/expired/payment_expired quote.
   */
  archive(): Quote {
    return this.transition('archived');
  }

  /**
   * Check if the response deadline has passed.
   */
  isResponseExpired(now: Date = new Date()): boolean {
    if (!this.quoteResponseDeadline) return false;
    return now.getTime() > this.quoteResponseDeadline.getTime();
  }

  /**
   * Check if the payment deadline has passed.
   */
  isPaymentExpired(now: Date = new Date()): boolean {
    if (!this.paymentDeadline) return false;
    return now.getTime() > this.paymentDeadline.getTime();
  }

  // ── Factories ─────────────────────────────────────────────────────────────

  /**
   * Create a valid quote request (all mandatory fields present).
   */
  static create(
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    description: string,
    neededByDate: Date,
  ): Quote {
    if (!customerName || customerName.trim().length === 0) {
      throw new Error('Customer name is required');
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      throw new Error('Customer email is required and must be valid');
    }
    if (!customerPhone || customerPhone.trim().length === 0) {
      throw new Error('Customer phone is required');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    return new Quote({
      id: crypto.randomUUID(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      description: description.trim(),
      neededByDate,
      status: 'pending',
      quotedPriceUsd: null,
      quotedLeadTimeDays: null,
      estimatedDeliveryDate: null,
      quoteSentAt: null,
      quoteResponseDeadline: null,
      paymentDeadline: null,
      acceptedAt: null,
      rejectedAt: null,
      paidAt: null,
      rejectionReason: null,
      actionTokenHash: null,
      actionTokenUsed: false,
      paymentServiceRef: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create a discarded record (incomplete data — missing name/email/phone).
   */
  static createDiscarded(
    customerName: string | null,
    customerEmail: string | null,
    customerPhone: string | null,
    description: string | null,
    neededByDate: Date | null,
    rejectionReason: string,
  ): Quote {
    return new Quote({
      id: crypto.randomUUID(),
      customerName: customerName ?? '',
      customerEmail: customerEmail ?? '',
      customerPhone: customerPhone ?? '',
      description: description ?? '',
      neededByDate: neededByDate ?? new Date(),
      status: 'discarded_incomplete_data',
      quotedPriceUsd: null,
      quotedLeadTimeDays: null,
      estimatedDeliveryDate: null,
      quoteSentAt: null,
      quoteResponseDeadline: null,
      paymentDeadline: null,
      acceptedAt: null,
      rejectedAt: null,
      paidAt: null,
      rejectionReason,
      actionTokenHash: null,
      actionTokenUsed: false,
      paymentServiceRef: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  toProps(): QuoteProps {
    return {
      id: this.id,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      description: this.description,
      neededByDate: this.neededByDate,
      status: this.status,
      quotedPriceUsd: this.quotedPriceUsd,
      quotedLeadTimeDays: this.quotedLeadTimeDays,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      quoteSentAt: this.quoteSentAt,
      quoteResponseDeadline: this.quoteResponseDeadline,
      paymentDeadline: this.paymentDeadline,
      acceptedAt: this.acceptedAt,
      rejectedAt: this.rejectedAt,
      paidAt: this.paidAt,
      rejectionReason: this.rejectionReason,
      actionTokenHash: this.actionTokenHash,
      actionTokenUsed: this.actionTokenUsed,
      paymentServiceRef: this.paymentServiceRef,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
