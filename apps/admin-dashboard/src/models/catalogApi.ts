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
  const res = await httpClient.get<PaginatedAdminPrototypes>('/admin/catalog/prototypes', {
    params,
  });
  return res.data;
}

export async function fetchAdminPrototypeById(id: string): Promise<AdminPrototypeDto> {
  const res = await httpClient.get<AdminPrototypeDto>(`/admin/catalog/prototypes/${id}`);
  return res.data;
}

export async function createPrototype(data: CreatePrototypePayload): Promise<AdminPrototypeDto> {
  const res = await httpClient.post<AdminPrototypeDto>('/admin/catalog/prototypes', data);
  return res.data;
}

export async function updatePrototype(
  id: string,
  data: UpdatePrototypePayload,
): Promise<AdminPrototypeDto> {
  const res = await httpClient.patch<AdminPrototypeDto>(`/admin/catalog/prototypes/${id}`, data);
  return res.data;
}

export async function deactivatePrototype(id: string): Promise<{ id: string; active: false }> {
  const res = await httpClient.patch<{ id: string; active: false }>(
    `/admin/catalog/prototypes/${id}/deactivate`,
  );
  return res.data;
}

export async function reactivatePrototype(id: string): Promise<AdminPrototypeDto> {
  const res = await httpClient.patch<AdminPrototypeDto>(
    `/admin/catalog/prototypes/${id}/reactivate`,
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
    `/admin/catalog/prototypes/${prototypeId}/images`,
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
    `/admin/catalog/prototypes/${prototypeId}/images/${imageId}`,
  );
  return res.data;
}

// ── Excel Import/Export ──────────────────────────────────────────────────────

export interface CatalogImportPreviewResponse {
  previewId: string;
  toCreate: { name: string; category: string; action: string }[];
  toUpdate: { name: string; category: string; action: string; changes?: Record<string, unknown> }[];
  toDeactivate: { name: string; category: string; action: string }[];
  errors: { row: number; field: string; message: string }[];
}

export interface CatalogConfirmImportResponse {
  applied: number;
  errors: { name: string; message: string }[];
}

export async function importCatalogExcelPreview(
  rows: Record<string, unknown>[],
): Promise<CatalogImportPreviewResponse> {
  const res = await httpClient.post<CatalogImportPreviewResponse>(
    '/admin/catalog/prototypes/import-excel',
    { rows },
  );
  return res.data;
}

export async function importCatalogExcelConfirm(
  previewId: string,
): Promise<CatalogConfirmImportResponse> {
  const res = await httpClient.post<CatalogConfirmImportResponse>(
    '/admin/catalog/prototypes/import-excel/confirm',
    { previewId },
  );
  return res.data;
}

export async function exportCatalogPrototypes(): Promise<{
  headers: string[];
  rows: Record<string, unknown>[];
}> {
  const res = await httpClient.get('/admin/catalog/prototypes/export-excel');
  return res.data;
}
