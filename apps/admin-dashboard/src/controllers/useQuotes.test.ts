import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuotes } from './useQuotes';

vi.mock('../models/quotesApi', () => ({
  fetchQuotes: vi.fn(),
  presentQuote: vi.fn(),
  archiveQuote: vi.fn(),
}));

import { fetchQuotes, presentQuote, archiveQuote } from '../models/quotesApi';
const mockFetchQuotes = vi.mocked(fetchQuotes);
const mockPresentQuote = vi.mocked(presentQuote);
const mockArchiveQuote = vi.mocked(archiveQuote);

const sampleQuotes = {
  items: [
    {
      id: 'q-1',
      customerName: 'Ana',
      customerEmail: 'ana@test.com',
      customerPhone: '123',
      description: 'Custom arch',
      neededByDate: '2026-09-01',
      status: 'pending' as const,
      quotedPriceUsd: null,
      quotedLeadTimeDays: null,
      estimatedDeliveryDate: null,
      quoteSentAt: null,
      quoteResponseDeadline: null,
      paymentDeadline: null,
      acceptedAt: null,
      rejectedAt: null,
      paidAt: null,
      createdAt: '2026-07-23T10:00:00Z',
      updatedAt: '2026-07-23T10:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

describe('useQuotes controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches quotes on mount', async () => {
    mockFetchQuotes.mockResolvedValue(sampleQuotes);
    const { result } = renderHook(() => useQuotes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quotes).toHaveLength(1);
    expect(result.current.quotes[0].customerName).toBe('Ana');
    expect(result.current.total).toBe(1);
  });

  it('sets error on fetch failure', async () => {
    mockFetchQuotes.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useQuotes());

    await waitFor(() => expect(result.current.error).toBe('Network error'));
  });

  it('calls presentQuote and reloads', async () => {
    mockFetchQuotes.mockResolvedValue(sampleQuotes);
    mockPresentQuote.mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.present('q-1', 200, 10, '2026-10-01');
    });

    expect(mockPresentQuote).toHaveBeenCalledWith('q-1', {
      priceUsd: 200,
      leadTimeDays: 10,
      estimatedDeliveryDate: '2026-10-01',
    });
    // fetchQuotes called again (reload)
    expect(mockFetchQuotes).toHaveBeenCalledTimes(2);
  });

  it('calls archiveQuote and reloads', async () => {
    mockFetchQuotes.mockResolvedValue(sampleQuotes);
    mockArchiveQuote.mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.archive('q-1');
    });

    expect(mockArchiveQuote).toHaveBeenCalledWith('q-1');
    expect(mockFetchQuotes).toHaveBeenCalledTimes(2);
  });

  it('filters by status', async () => {
    mockFetchQuotes.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const { result } = renderHook(() => useQuotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStatusFilter('quoted');
    });

    await waitFor(() =>
      expect(mockFetchQuotes).toHaveBeenCalledWith(expect.objectContaining({ status: 'quoted' })),
    );
  });
});
