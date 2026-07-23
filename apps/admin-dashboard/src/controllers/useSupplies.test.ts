import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSupplies } from './useSupplies';

vi.mock('../models/suppliesApi', () => ({
  fetchSupplies: vi.fn(),
  createSupply: vi.fn(),
  updateSupply: vi.fn(),
  deleteSupply: vi.fn(),
}));

import { fetchSupplies, createSupply, updateSupply, deleteSupply } from '../models/suppliesApi';
const mockFetch = vi.mocked(fetchSupplies);
const mockCreate = vi.mocked(createSupply);
vi.mocked(updateSupply); // used by hook internally
const mockDelete = vi.mocked(deleteSupply);

const sampleData = {
  items: [
    {
      id: 's-1',
      sku: 'MDF-001',
      name: 'MDF Board',
      unit: 'm2',
      currentQty: 50,
      minStock: 10,
      unitCostUsd: 12.5,
      supplier: 'Acme',
      createdAt: '2026-07-23T10:00:00Z',
      updatedAt: '2026-07-23T10:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

describe('useSupplies controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches supplies on mount', async () => {
    mockFetch.mockResolvedValue(sampleData);
    const { result } = renderHook(() => useSupplies());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.supplies).toHaveLength(1);
    expect(result.current.supplies[0].sku).toBe('MDF-001');
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useSupplies());

    await waitFor(() => expect(result.current.error).toBe('Server error'));
  });

  it('calls createSupply and reloads', async () => {
    mockFetch.mockResolvedValue(sampleData);
    mockCreate.mockResolvedValue(sampleData.items[0]);
    const { result } = renderHook(() => useSupplies());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.create({
        sku: 'NEW-1',
        name: 'New',
        unit: 'unit',
        currentQty: 10,
        minStock: 5,
        unitCostUsd: 3,
      });
    });

    expect(mockCreate).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('calls deleteSupply and reloads', async () => {
    mockFetch.mockResolvedValue(sampleData);
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSupplies());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove('s-1');
    });

    expect(mockDelete).toHaveBeenCalledWith('s-1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('filters by belowMin', async () => {
    mockFetch.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const { result } = renderHook(() => useSupplies());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setBelowMinOnly(true);
    });

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ belowMin: true })),
    );
  });
});
