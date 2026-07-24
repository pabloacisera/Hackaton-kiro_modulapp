import { httpClient } from './http-client';

export interface AdminPrototypeDto {
  id: string;
  name: string;
  description: string;
  category: 'modular_furniture' | 'arches';
  priceUsd: number;
  active: boolean;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays: number | null;
  images: { id: string; url: string; order: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminPrototypes {
  items: AdminPrototypeDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePrototypePayload {
  name: string;
  description: string;
  category: 'modular_furniture' | 'arches';
  priceUsd: number;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays?: number | null;
}

export interface UpdatePrototypePayload {
  name?: string;
  description?: string;
  category?: 'modular_furniture' | 'arches';
  priceUsd?: number;
  stockQty?: number;
  buildOnDemand?: boolean;
  estimatedDeliveryDays?: number | null;
}

export async function fetchAdminPrototypes(params?: {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedAdminPrototypes> {
  const res = await httpClient.get<PaginatedAdminPrototypes>('/api/admin/catalog/prototypes', {
    params,
  });
  return res.data;
}

export async function fetchAdminPrototypeById(id: string): Promise<AdminPrototypeDto> {
  const res = await httpClient.get<AdminPrototypeDto>(`/api/admin/catalog/prototypes/${id}`);
  return res.data;
}

export async function createPrototype(data: CreatePrototypePayload): Promise<AdminPrototypeDto> {
  const res = await httpClient.post<AdminPrototypeDto>('/api/admin/catalog/prototypes', data);
  return res.data;
}

export async function updatePrototype(
  id: string,
  data: UpdatePrototypePayload,
): Promise<AdminPrototypeDto> {
  const res = await httpClient.patch<AdminPrototypeDto>(
    `/api/admin/catalog/prototypes/${id}`,
    data,
  );
  return res.data;
}

export async function deactivatePrototype(id: string): Promise<{ id: string; active: false }> {
  const res = await httpClient.patch<{ id: string; active: false }>(
    `/api/admin/catalog/prototypes/${id}/deactivate`,
  );
  return res.data;
}

export async function reactivatePrototype(id: string): Promise<AdminPrototypeDto> {
  const res = await httpClient.patch<AdminPrototypeDto>(
    `/api/admin/catalog/prototypes/${id}/reactivate`,
  );
  return res.data;
}

export async function uploadPrototypeImage(
  prototypeId: string,
  file: File,
): Promise<{ id: string; url: string; order: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.post<{ id: string; url: string; order: number }>(
    `/api/admin/catalog/prototypes/${prototypeId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function deletePrototypeImage(
  prototypeId: string,
  imageId: string,
): Promise<{ deleted: boolean }> {
  const res = await httpClient.delete<{ deleted: boolean }>(
    `/api/admin/catalog/prototypes/${prototypeId}/images/${imageId}`,
  );
  return res.data;
}
