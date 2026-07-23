import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import { IPrototypeRepository, PROTOTYPE_REPOSITORY } from '../../catalog/repositories/prototype.repository.port';
import { Prototype } from '../../catalog/domain/prototype.entity';

/**
 * TASK-directpurchase-8: Admin accepts an order.
 *
 * FR4 / Acceptance criteria:
 *   - Stock is deducted ONLY here, ONLY on acceptance.
 *   - Delivery date is required.
 *   - If prototype is build_on_demand, stock deduction is skipped (no physical stock).
 */
@Injectable()
export class AcceptOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
  ) {}

  async execute(orderId: string, estimatedDeliveryDate: Date): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'paid_pending_acceptance') {
      throw new BadRequestException(
        `Cannot accept order in status: ${order.status}`,
      );
    }

    // ── Deduct stock (only on acceptance, only if not build_on_demand) ────
    const prototype = await this.protoRepo.findById(order.prototypeId);
    if (prototype && !prototype.buildOnDemand && prototype.stockQty > 0) {
      const updated: Prototype = prototype.deductStock(1);
      await this.protoRepo.save(updated);
    }

    // ── Transition to accepted ────────────────────────────────────────────
    const accepted = order.accept(estimatedDeliveryDate);
    await this.orderRepo.update(accepted);
  }
}
