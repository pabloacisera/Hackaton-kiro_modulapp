import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import {
  IPrototypeRepository,
  PROTOTYPE_REPOSITORY,
} from '../../catalog/repositories/prototype.repository.port';
import { Prototype } from '../../catalog/domain/prototype.entity';
import {
  IDeliveryTrackingRepository,
  DELIVERY_TRACKING_REPOSITORY,
} from '../../deliveries/repositories/delivery-tracking.repository.port';
import { DeliveryTracking } from '../../deliveries/domain/delivery-item.entity';

@Injectable()
export class AcceptOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
    @Inject(DELIVERY_TRACKING_REPOSITORY)
    private readonly deliveryRepo: IDeliveryTrackingRepository,
  ) {}

  async execute(orderId: string, estimatedDeliveryDate: Date): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'paid_pending_acceptance') {
      throw new BadRequestException(`Cannot accept order in status: ${order.status}`);
    }

    if (order.prototypeId) {
      const prototype = await this.protoRepo.findById(order.prototypeId);
      if (prototype && !prototype.buildOnDemand && prototype.stockQty > 0) {
        const updated: Prototype = prototype.deductStock(1);
        await this.protoRepo.save(updated);
      }
    }

    const accepted = order.accept(estimatedDeliveryDate);
    await this.orderRepo.update(accepted);

    const tracking = new DeliveryTracking({
      id: crypto.randomUUID(),
      orderId: accepted.id,
      origin: accepted.origin,
      customerName: accepted.customerName ?? accepted.customerEmail,
      customerEmail: accepted.customerEmail,
      quoteId: accepted.quoteId,
      estimatedDeliveryDate,
      status: 'pending',
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.deliveryRepo.save(tracking);
  }
}
