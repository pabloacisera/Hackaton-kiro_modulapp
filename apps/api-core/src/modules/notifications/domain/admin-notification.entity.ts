export type NotificationType =
  | 'new_purchase'
  | 'new_quote_request'
  | 'quote_response'
  | 'new_complaint'
  | 'low_stock_minimum'
  | 'payment_confirmed';

export interface AdminNotificationProps {
  id: string;
  type: NotificationType;
  message: string;
  referenceUrl: string;
  read: boolean;
  createdAt: Date;
}

export class AdminNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly message: string;
  readonly referenceUrl: string;
  readonly read: boolean;
  readonly createdAt: Date;

  constructor(props: AdminNotificationProps) {
    Object.assign(this, props);
  }

  static create(
    type: NotificationType,
    message: string,
    referenceUrl: string,
  ): AdminNotification {
    if (!message || !referenceUrl) {
      throw new Error('Notification must have a message and referenceUrl');
    }
    return new AdminNotification({
      id: crypto.randomUUID(),
      type,
      message,
      referenceUrl,
      read: false,
      createdAt: new Date(),
    });
  }

  markRead(): AdminNotification {
    return new AdminNotification({ ...this, read: true });
  }
}
