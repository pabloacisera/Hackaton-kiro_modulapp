export type DeliveryOrigin = 'order' | 'quote';
export type DeliveryStatus = 'pending' | 'delivered';

export interface DeliveryTrackingProps {
  id: string;
  orderId: string;
  origin: DeliveryOrigin;
  customerName: string;
  customerEmail: string;
  quoteId: string | null;
  estimatedDeliveryDate: Date;
  status: DeliveryStatus;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliveryTracking {
  readonly id: string;
  readonly orderId: string;
  readonly origin: DeliveryOrigin;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly quoteId: string | null;
  readonly estimatedDeliveryDate: Date;
  readonly status: DeliveryStatus;
  readonly deliveredAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DeliveryTrackingProps) {
    Object.assign(this, props);
  }

  static isOverdue(
    estimatedDeliveryDate: Date,
    deliveredAt: Date | null,
    now: Date = new Date(),
  ): boolean {
    if (deliveredAt) return false;
    return now.getTime() > estimatedDeliveryDate.getTime();
  }

  deliver(): DeliveryTracking {
    if (this.deliveredAt) {
      throw new Error('Already delivered');
    }
    return new DeliveryTracking({
      ...this.toProps(),
      status: 'delivered',
      deliveredAt: new Date(),
      updatedAt: new Date(),
    });
  }

  postpone(newDate: Date): DeliveryTracking {
    if (this.deliveredAt) {
      throw new Error('Cannot postpone: already delivered');
    }
    if (newDate.getTime() <= new Date().getTime()) {
      throw new Error('New delivery date must be in the future');
    }
    return new DeliveryTracking({
      ...this.toProps(),
      estimatedDeliveryDate: newDate,
      updatedAt: new Date(),
    });
  }

  toProps(): DeliveryTrackingProps {
    return {
      id: this.id,
      orderId: this.orderId,
      origin: this.origin,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      quoteId: this.quoteId,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      status: this.status,
      deliveredAt: this.deliveredAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
