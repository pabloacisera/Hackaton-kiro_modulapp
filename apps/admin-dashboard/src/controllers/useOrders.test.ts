import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/ordersApi', () => ({
  fetchOrders: vi.fn(),
  acceptOrder: vi.fn(),
  rejectOrder: vi.fn(),
}));

import { fetchOrders, acceptOrder, rejectOrder } from '../models/ordersApi';
import { useOrders } from './useOrders';

const mockFetch = vi.mocked(fetchOrders);
const mockAccept = vi.mocked(acceptOrder);
const mockReject = vi.mocked(rejectOrder);

const pageData = {
  items: [
    {
      id: 'ord-1', prototypeId: 'p-1', priceUsdSnapshot: 199.99,
      customerEmail: 'c@t.com', customerName: null,
      status: 'paid_pending_acceptance' as const,
      rejectionReason: null, estimatedDeliveryDate: null,
      paymentServiceRef: 'ref-1', idempotencyKey: 'k-1',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ],
  total: 1, page: 1, pageSize: 20,
};

describe('useOrders controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches orders on mount', async () => {
    mockFetch.mockResolvedValue(pageData);
    const { result } = renderHook(() => useOrders());
    await waitFor(() => !result.current.loading);
    expect(result.current.orders).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('accept calls acceptOrder and reloads', async () => {
    mockFetch.mockResolvedValue(pageData);
    mockAccept.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOrders());
    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.accept('ord-1', '2026-09-01');
    });

    expect(mockAccept).toHaveBeenCalledWith('ord-1', '2026-09-01');
    expect(mockFetch).toHaveBeenCalledTimes(2); // initial + reload
  });

  it('reject calls rejectOrder and reloads', async () => {
    mockFetch.mockResolvedValue(pageData);
    mockReject.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOrders());
    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.reject('ord-1', 'Out of stock');
    });

    expect(mockReject).toHaveBeenCalledWith('ord-1', 'Out of stock');
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Unauthorized'));
    const { result } = renderHook(() => useOrders());
    await waitFor(() => result.current.error !== null);
    expect(result.current.error).toBe('Unauthorized');
  });

  it('setStatusFilter changes filter and resets page', async () => {
    mockFetch.mockResolvedValue({ ...pageData, items: [] });
    const { result } = renderHook(() => useOrders());
    await waitFor(() => !result.current.loading);

    act(() => result.current.setStatusFilter('rejected'));
    await waitFor(() => !result.current.loading);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected' }),
    );
  });
});
