import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISupplyRepository, SUPPLY_REPOSITORY } from '../repositories/supply.repository.port';
import { LowStockAlertState } from '../domain/low-stock-alert-state.entity';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * TASK-stock-7: BullMQ job `hourly-low-stock-check` with anti-fatigue alert logic.
 *
 * - Iterates all supplies where current_qty < min_stock
 * - For each, checks LowStockAlertState:
 *   - Notifies if first time (no alert state exists)
 *   - Notifies if worsened (currentQty < lastNotifiedQty)
 *   - Notifies if ≥24h since last notification
 *   - Skips if already notified and unchanged/improved within 24h
 */
@Injectable()
export class LowStockCheckJob {
  private readonly logger = new Logger(LowStockCheckJob.name);

  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly repo: ISupplyRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(): Promise<number> {
    const belowMin = await this.repo.findBelowMinimum();
    let notified = 0;

    for (const supply of belowMin) {
      const alertState = await this.repo.findAlertState(supply.id);

      if (!alertState) {
        // First detection — notify and create state
        await this.notifications.notifyAdmins(
          'low_stock_minimum',
          `Low stock: ${supply.name} (${supply.sku}) — ${supply.currentQty} ${supply.unit} (min: ${supply.minStock})`,
          `/admin/supplies?highlight=${supply.id}`,
        );
        const newState = LowStockAlertState.createInitial(supply.id, supply.currentQty);
        await this.repo.saveAlertState(newState);
        notified++;
      } else if (alertState.shouldNotify(supply.currentQty)) {
        // Worsened or ≥24h — notify and update state
        await this.notifications.notifyAdmins(
          'low_stock_minimum',
          `Low stock: ${supply.name} (${supply.sku}) — ${supply.currentQty} ${supply.unit} (min: ${supply.minStock})`,
          `/admin/supplies?highlight=${supply.id}`,
        );
        const updated = alertState.markNotified(supply.currentQty);
        await this.repo.updateAlertState(updated);
        notified++;
      }
      // else: skip (already notified, not worsened, < 24h)
    }

    if (notified > 0) {
      this.logger.log(`Low stock check: ${notified} notification(s) sent`);
    }
    return notified;
  }
}
