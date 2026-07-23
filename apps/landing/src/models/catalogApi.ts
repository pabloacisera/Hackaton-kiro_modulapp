/**
 * TASK-catalog-5: Catalog API model — fetch + SSE subscription.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface ProtoImageDto {
  id: string;
  url: string;
  order: number;
}

export interface PrototypeDto {
  id: string;
  name: string;
  description: string;
  category: 'modular_furniture' | 'arches';
  priceUsd: number;
  active: boolean;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays: number | null;
  images: ProtoImageDto[];
}

export interface CatalogListResponse {
  items: PrototypeDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogFilter {
  category?: 'modular_furniture' | 'arches';
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchPrototypes(filter: CatalogFilter = {}): Promise<CatalogListResponse> {
  const params = new URLSearchParams();
  if (filter.category)  params.set('category',  filter.category);
  if (filter.q)         params.set('q',          filter.q);
  if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice));
  if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice));
  if (filter.page)      params.set('page',      String(filter.page));
  if (filter.pageSize)  params.set('pageSize',  String(filter.pageSize));

  const res = await fetch(`${API_BASE}/catalog/prototypes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch catalog');
  return res.json();
}

export async function fetchPrototypeById(id: string): Promise<PrototypeDto> {
  const res = await fetch(`${API_BASE}/catalog/prototypes/${id}`);
  if (!res.ok) throw new Error(`Prototype ${id} not found`);
  return res.json();
}

export type CatalogSseEvent =
  | { type: 'prototype.updated';     payload: Partial<PrototypeDto> & { id: string } }
  | { type: 'prototype.deactivated'; payload: { id: string } };

/**
 * Connects to the SSE catalog stream.
 * Returns a cleanup function — call it to close the connection.
 */
export function subscribeCatalogStream(
  onEvent: (event: CatalogSseEvent) => void,
): () => void {
  const es = new EventSource(`${API_BASE}/catalog/stream`);

  const handleEvent = (raw: MessageEvent, type: CatalogSseEvent['type']) => {
    try {
      const payload = JSON.parse(raw.data);
      onEvent({ type, payload } as CatalogSseEvent);
    } catch { /* ignore malformed */ }
  };

  es.addEventListener('prototype.updated',     (e) => handleEvent(e, 'prototype.updated'));
  es.addEventListener('prototype.deactivated', (e) => handleEvent(e, 'prototype.deactivated'));

  return () => es.close();
}
