import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/catalogApi', () => ({
  fetchAdminPrototypes: vi.fn(),
  createPrototype: vi.fn(),
  updatePrototype: vi.fn(),
  deactivatePrototype: vi.fn(),
  reactivatePrototype: vi.fn(),
}));

import {
  fetchAdminPrototypes,
  createPrototype,
  updatePrototype,
  deactivatePrototype,
  reactivatePrototype,
  AdminPrototypeDto,
} from '../models/catalogApi';
import { useCatalog } from './useCatalog';

const mockFetch = vi.mocked(fetchAdminPrototypes);
const mockCreate = vi.mocked(createPrototype);
const mockUpdate = vi.mocked(updatePrototype);
const mockDeactivate = vi.mocked(deactivatePrototype);
const mockReactivate = vi.mocked(reactivatePrototype);

const mockPrototypes: AdminPrototypeDto[] = [
  {
    id: 'p-1',
    name: 'Bookshelf',
    description: 'A modular bookshelf',
    category: 'modular_furniture',
    priceUsd: 149.99,
    active: true,
    stockQty: 10,
    buildOnDemand: false,
    estimatedDeliveryDays: 7,
    images: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-2',
    name: 'Wedding Arch',
    description: 'Elegant arch',
    category: 'arches',
    priceUsd: 299,
    active: false,
    stockQty: 2,
    buildOnDemand: true,
    estimatedDeliveryDays: 14,
    images: [],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('useCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      items: mockPrototypes,
      total: 2,
      page: 1,
      pageSize: 20,
    });
  });

  it('fetches prototypes on mount', async () => {
    const { result } = renderHook(() => useCatalog());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prototypes).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith({
      q: undefined,
      category: undefined,
      page: 1,
    });
  });

  it('calls createPrototype and reloads', async () => {
    mockCreate.mockResolvedValue(mockPrototypes[0]);

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.create({
        name: 'New Item',
        description: 'A brand new item for the catalog',
        category: 'modular_furniture',
        priceUsd: 100,
        stockQty: 5,
        buildOnDemand: false,
      });
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'New Item',
      description: 'A brand new item for the catalog',
      category: 'modular_furniture',
      priceUsd: 100,
      stockQty: 5,
      buildOnDemand: false,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('calls updatePrototype and reloads', async () => {
    mockUpdate.mockResolvedValue(mockPrototypes[0]);

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.update('p-1', { priceUsd: 200 });
    });

    expect(mockUpdate).toHaveBeenCalledWith('p-1', { priceUsd: 200 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('calls deactivatePrototype and reloads', async () => {
    mockDeactivate.mockResolvedValue({ id: 'p-1', active: false });

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deactivate('p-1');
    });

    expect(mockDeactivate).toHaveBeenCalledWith('p-1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('calls reactivatePrototype and reloads', async () => {
    mockReactivate.mockResolvedValue(mockPrototypes[1]);

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reactivate('p-2');
    });

    expect(mockReactivate).toHaveBeenCalledWith('p-2');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.prototypes).toHaveLength(0);
  });
});
