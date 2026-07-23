import { httpClient } from './http-client';

export type DeliveryStatus = 'pending' | 'delivered' | 'overdue';
export type DeliveryOrigin = 'order' | 'quote';

export interface DeliveryDto {
  id: string;
  origin: DeliveryOrigin;
  customerName: string;
  customerEmail: string;
  estimatedDeliveryDate: string;
  status: DeliveryStatus;
  deliveredAt: string | null;
}

export interface PaginatedDeliveries {
  items: DeliveryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchDeliveries(params?: {
  status?: DeliveryStatus;
  q?: string;
  page?: number;
}): Promise<PaginatedDeliveries> {
  const res = await httpClient.get<PaginatedDeliveries>('/api/admin/deliveries', { params });
  return res.data;
}

export async function markDelivered(origin: DeliveryOrigin, id: string): Promise<void> {
  await httpClient.patch(`/api/admin/deliveries/${origin}/${id}/deliver`);
}

export async function postponeDelivery(
  origin: DeliveryOrigin,
  id: string,
  newDate: string,
): Promise<void> {
  await httpClient.patch(`/api/admin/deliveries/${origin}/${id}/postpone`, { newDate });
}
