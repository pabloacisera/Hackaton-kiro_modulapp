import { httpClient } from './http-client';

export interface SupplyDto {
  id: string;
  sku: string;
  name: string;
  unit: string;
  currentQty: number;
  minStock: number;
  unitCostUsd: number;
  supplier: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSupplies {
  items: SupplyDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportPreviewResponse {
  previewId: string;
  toCreate: { sku: string; name: string; action: string }[];
  toUpdate: { sku: string; name: string; action: string; changes?: Record<string, unknown> }[];
  errors: { row: number; field: string; message: string }[];
}

export interface ConfirmImportResponse {
  applied: number;
  errors: { sku: string; message: string }[];
}

export async function fetchSupplies(params?: {
  search?: string;
  supplier?: string;
  belowMin?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedSupplies> {
  const res = await httpClient.get<PaginatedSupplies>('/api/admin/supplies', { params });
  return res.data;
}

export async function createSupply(data: {
  sku: string;
  name: string;
  unit: string;
  currentQty: number;
  minStock: number;
  unitCostUsd: number;
  supplier?: string;
}): Promise<SupplyDto> {
  const res = await httpClient.post<SupplyDto>('/api/admin/supplies', data);
  return res.data;
}

export async function updateSupply(
  id: string,
  data: Partial<{
    name: string;
    unit: string;
    currentQty: number;
    minStock: number;
    unitCostUsd: number;
    supplier: string;
  }>,
): Promise<SupplyDto> {
  const res = await httpClient.patch<SupplyDto>(`/api/admin/supplies/${id}`, data);
  return res.data;
}

export async function deleteSupply(id: string): Promise<void> {
  await httpClient.delete(`/api/admin/supplies/${id}`);
}

export async function importExcelPreview(
  rows: Record<string, unknown>[],
): Promise<ImportPreviewResponse> {
  const res = await httpClient.post<ImportPreviewResponse>('/api/admin/supplies/import-excel', {
    rows,
  });
  return res.data;
}

export async function importExcelConfirm(previewId: string): Promise<ConfirmImportResponse> {
  const res = await httpClient.post<ConfirmImportResponse>(
    '/api/admin/supplies/import-excel/confirm',
    { previewId },
  );
  return res.data;
}

export async function exportSupplies(): Promise<{
  headers: string[];
  rows: Record<string, unknown>[];
}> {
  const res = await httpClient.get('/api/admin/supplies/export-excel');
  return res.data;
}
