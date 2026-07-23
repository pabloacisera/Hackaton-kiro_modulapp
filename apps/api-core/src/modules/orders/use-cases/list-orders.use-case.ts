import { Inject, Injectable } from '@nestjs/common';
import {
  IOrderRepository,
  ListOrdersFilter,
  ORDER_REPOSITORY,
  PaginatedOrders,
} from '../repositories/order.repository.port';

/**
 * TASK-directpurchase-11: List orders with filter/search/pagination.
 */
@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(filter: ListOrdersFilter): Promise<PaginatedOrders> {
    return this.orderRepo.findAll({
      ...filter,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 20,
    });
  }
}
