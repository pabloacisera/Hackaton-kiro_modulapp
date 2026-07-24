import { httpClient } from './http-client';

export type OrderStatus =
  | 'created'
  | 'payment_initiated'
  | 'paid_pending_acceptance'
  | 'accepted'
  | 'rejected'
  | 'payment_failed';

export interface OrderDto {
  id: string;
  prototypeId: string;
  priceUsdSnapshot: number;
  customerEmail: string;
  customerName: string | null;
  status: OrderStatus;
  rejectionReason: string | null;
  estimatedDeliveryDate: string | null;
  paymentServiceRef: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  items: OrderDto[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchOrders(params?: {
  status?: OrderStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedOrders> {
  const res = await httpClient.get<PaginatedOrders>('/orders', { params });
  return res.data;
}

export async function acceptOrder(orderId: string, estimatedDeliveryDate: string): Promise<void> {
  await httpClient.patch(`/orders/${orderId}/accept`, { estimatedDeliveryDate });
}

export async function rejectOrder(orderId: string, reason: string): Promise<void> {
  await httpClient.patch(`/orders/${orderId}/reject`, { reason });
}
