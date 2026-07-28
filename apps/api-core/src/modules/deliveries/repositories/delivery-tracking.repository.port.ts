import { DeliveryTracking, DeliveryStatus } from '../domain/delivery-item.entity';

export interface ListDeliveryTrackingFilter {
  status?: DeliveryStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDeliveryTracking {
  items: DeliveryTracking[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IDeliveryTrackingRepository {
  findById(id: string): Promise<DeliveryTracking | null>;
  findByOrderId(orderId: string): Promise<DeliveryTracking | null>;
  findAll(filter: ListDeliveryTrackingFilter): Promise<PaginatedDeliveryTracking>;
  save(tracking: DeliveryTracking): Promise<DeliveryTracking>;
  update(tracking: DeliveryTracking): Promise<DeliveryTracking>;
}

export const DELIVERY_TRACKING_REPOSITORY = Symbol('IDeliveryTrackingRepository');
