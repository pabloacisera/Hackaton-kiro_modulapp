/**
 * TASK-stock-7: LowStockAlertState — anti-fatigue alert logic.
 *
 * Rules:
 * - Notify if first time (lastNotifiedAt is null → represented by absence of record)
 * - Notify if worsened (currentQty < lastNotifiedQty)
 * - Notify if ≥24h since last notification
 * - Skip if already notified and unchanged/improved
 */

export interface LowStockAlertStateProps {
  id: string;
  supplyId: string;
  lastNotifiedAt: Date;
  lastNotifiedQty: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export class LowStockAlertState {
  readonly id: string;
  readonly supplyId: string;
  readonly lastNotifiedAt: Date;
  readonly lastNotifiedQty: number;

  constructor(props: LowStockAlertStateProps) {
    Object.assign(this, props);
  }

  /**
   * Determine if a new notification should be sent.
   * Returns true if worsened or ≥24h since last notification.
   */
  shouldNotify(currentQty: number, now: Date = new Date()): boolean {
    // Worsened: current quantity dropped below last notified
    if (currentQty < this.lastNotifiedQty) return true;

    // ≥24h since last notification
    if (now.getTime() - this.lastNotifiedAt.getTime() >= TWENTY_FOUR_HOURS_MS) return true;

    return false;
  }

  /** Update state after sending a notification */
  markNotified(currentQty: number): LowStockAlertState {
    return new LowStockAlertState({
      ...this.toProps(),
      lastNotifiedAt: new Date(),
      lastNotifiedQty: currentQty,
    });
  }

  static createInitial(supplyId: string, currentQty: number): LowStockAlertState {
    return new LowStockAlertState({
      id: crypto.randomUUID(),
      supplyId,
      lastNotifiedAt: new Date(),
      lastNotifiedQty: currentQty,
    });
  }

  toProps(): LowStockAlertStateProps {
    return {
      id: this.id,
      supplyId: this.supplyId,
      lastNotifiedAt: this.lastNotifiedAt,
      lastNotifiedQty: this.lastNotifiedQty,
    };
  }
}
