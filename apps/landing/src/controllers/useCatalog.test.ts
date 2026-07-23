import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/catalogApi', () => ({
  fetchPrototypes: vi.fn(),
  subscribeCatalogStream: vi.fn(() => vi.fn()),
}));

import { fetchPrototypes, subscribeCatalogStream, CatalogListResponse } from '../models/catalogApi';
import { useCatalog } from './useCatalog';

const mockFetch = vi.mocked(fetchPrototypes);
const mockSubscribe = vi.mocked(subscribeCatalogStream);

const page1: CatalogListResponse = {
  items: [
    {
      id: 'p-1',
      name: 'Arch A',
      category: 'arches',
      priceUsd: 100,
      active: true,
      stockQty: 5,
      buildOnDemand: false,
      description: 'd',
      estimatedDeliveryDays: 7,
      images: [],
    },
  ],
  total: 1,
  page: 1,
  pageSize: 12,
};

describe('useCatalog controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue(vi.fn());
  });

  it('fetches catalog on mount with default filter', async () => {
    mockFetch.mockResolvedValue(page1);
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 12 }));
  });

  it('passes category filter to fetch', async () => {
    mockFetch.mockResolvedValue({ ...page1, items: [] });
    const { result } = renderHook(() => useCatalog({ category: 'arches' }));
    await waitFor(() => !result.current.loading);
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ category: 'arches' }));
  });

  it('setFilter triggers re-fetch with combined filters', async () => {
    mockFetch.mockResolvedValue(page1);
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => !result.current.loading);

    act(() => result.current.setFilter({ q: 'wooden', minPrice: 50 }));
    await waitFor(() => !result.current.loading);

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ q: 'wooden', minPrice: 50 }));
  });

  it('subscribes to SSE stream on mount', async () => {
    mockFetch.mockResolvedValue(page1);
    renderHook(() => useCatalog());
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
  });

  it('sets error state on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => result.current.error !== null);
    expect(result.current.error).toBe('Network error');
  });
});
