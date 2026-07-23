/**
 * TASK-delivery-1: DeliveryItem — unified projection model.
 * Merges accepted orders (Flow A) and paid quotes (Flow B) into a single view.
 *
 * "overdue" is calculated: today > estimatedDeliveryDate AND status !== 'delivered'
 */

export type DeliveryOrigin = 'order' | 'quote';
export type DeliveryStatus = 'pending' | 'delivered' | 'overdue';

export interface DeliveryItemProps {
  id: string;
  origin: DeliveryOrigin;
  customerName: string;
  customerEmail: string;
  estimatedDeliveryDate: Date;
  status: DeliveryStatus;
  deliveredAt: Date | null;
}

export class DeliveryItem {
  readonly id: string;
  readonly origin: DeliveryOrigin;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly estimatedDeliveryDate: Date;
  readonly status: DeliveryStatus;
  readonly deliveredAt: Date | null;

  constructor(props: DeliveryItemProps) {
    Object.assign(this, props);
  }

  /** Calculate whether this delivery is overdue */
  static calculateStatus(
    estimatedDeliveryDate: Date,
    deliveredAt: Date | null,
    now: Date = new Date(),
  ): DeliveryStatus {
    if (deliveredAt) return 'delivered';
    if (now.getTime() > estimatedDeliveryDate.getTime()) return 'overdue';
    return 'pending';
  }

  /** Mark as delivered */
  deliver(): DeliveryItem {
    if (this.deliveredAt) {
      throw new Error('Already delivered');
    }
    return new DeliveryItem({
      ...this.toProps(),
      status: 'delivered',
      deliveredAt: new Date(),
    });
  }

  /** Postpone delivery date */
  postpone(newDate: Date): DeliveryItem {
    if (this.deliveredAt) {
      throw new Error('Cannot postpone: already delivered');
    }
    if (newDate.getTime() <= new Date().getTime()) {
      throw new Error('New delivery date must be in the future');
    }
    return new DeliveryItem({
      ...this.toProps(),
      estimatedDeliveryDate: newDate,
      status: DeliveryItem.calculateStatus(newDate, null),
    });
  }

  toProps(): DeliveryItemProps {
    return {
      id: this.id,
      origin: this.origin,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      status: this.status,
      deliveredAt: this.deliveredAt,
    };
  }
}
