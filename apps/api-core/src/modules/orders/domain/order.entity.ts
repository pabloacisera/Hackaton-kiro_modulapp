export type OrderStatus =
  | 'created'
  | 'payment_initiated'
  | 'paid_pending_acceptance'
  | 'accepted'
  | 'rejected'
  | 'payment_failed';

export type OrderOrigin = 'order' | 'quote';

export interface OrderProps {
  id: string;
  origin: OrderOrigin;
  prototypeId: string | null;
  quoteId: string | null;
  priceUsdSnapshot: number;
  customerEmail: string;
  customerName: string | null;
  status: OrderStatus;
  rejectionReason: string | null;
  estimatedDeliveryDate: Date | null;
  paymentServiceRef: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['payment_initiated'],
  payment_initiated: ['paid_pending_acceptance', 'payment_failed'],
  paid_pending_acceptance: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  payment_failed: [],
};

export class Order {
  readonly id: string;
  readonly origin: OrderOrigin;
  readonly prototypeId: string | null;
  readonly quoteId: string | null;
  readonly priceUsdSnapshot: number;
  readonly customerEmail: string;
  readonly customerName: string | null;
  readonly status: OrderStatus;
  readonly rejectionReason: string | null;
  readonly estimatedDeliveryDate: Date | null;
  readonly paymentServiceRef: string | null;
  readonly idempotencyKey: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OrderProps) {
    if (!props.customerEmail || !props.customerEmail.includes('@')) {
      throw new Error('Customer email is required and must be valid');
    }
    if (props.priceUsdSnapshot <= 0) {
      throw new Error('Price snapshot must be positive');
    }
    Object.assign(this, props);
  }

  private transition(next: OrderStatus, patch: Partial<OrderProps> = {}): Order {
    const allowed = ALLOWED_TRANSITIONS[this.status];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid transition: ${this.status} → ${next}. Allowed: [${allowed.join(', ')}]`,
      );
    }
    return new Order({
      ...this.toProps(),
      ...patch,
      status: next,
      updatedAt: new Date(),
    });
  }

  initiatePayment(paymentServiceRef: string): Order {
    return this.transition('payment_initiated', { paymentServiceRef });
  }

  confirmPayment(): Order {
    return this.transition('paid_pending_acceptance');
  }

  failPayment(): Order {
    return this.transition('payment_failed');
  }

  accept(estimatedDeliveryDate: Date): Order {
    if (!estimatedDeliveryDate) {
      throw new Error('Estimated delivery date is required when accepting');
    }
    return this.transition('accepted', { estimatedDeliveryDate });
  }

  reject(reason: string): Order {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }
    return this.transition('rejected', { rejectionReason: reason });
  }

  static create(
    prototypeId: string,
    priceUsdSnapshot: number,
    customerEmail: string,
    customerName: string | null,
    idempotencyKey: string,
  ): Order {
    return new Order({
      id: crypto.randomUUID(),
      origin: 'order',
      prototypeId,
      quoteId: null,
      priceUsdSnapshot,
      customerEmail,
      customerName,
      status: 'created',
      rejectionReason: null,
      estimatedDeliveryDate: null,
      paymentServiceRef: null,
      idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createFromQuote(
    quoteId: string,
    priceUsdSnapshot: number,
    customerEmail: string,
    customerName: string,
    estimatedDeliveryDate: Date,
    paymentServiceRef: string,
  ): Order {
    return new Order({
      id: crypto.randomUUID(),
      origin: 'quote',
      prototypeId: null,
      quoteId,
      priceUsdSnapshot,
      customerEmail,
      customerName,
      status: 'accepted',
      rejectionReason: null,
      estimatedDeliveryDate,
      paymentServiceRef,
      idempotencyKey: `quote-order-${quoteId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  toProps(): OrderProps {
    return {
      id: this.id,
      origin: this.origin,
      prototypeId: this.prototypeId,
      quoteId: this.quoteId,
      priceUsdSnapshot: this.priceUsdSnapshot,
      customerEmail: this.customerEmail,
      customerName: this.customerName,
      status: this.status,
      rejectionReason: this.rejectionReason,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      paymentServiceRef: this.paymentServiceRef,
      idempotencyKey: this.idempotencyKey,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
