import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useComplaints } from './useComplaints';

vi.mock('../models/complaintsApi', () => ({
  fetchComplaints: vi.fn(),
  reviewComplaint: vi.fn(),
  approveRefund: vi.fn(),
  resolveComplaint: vi.fn(),
}));

import { fetchComplaints, reviewComplaint, approveRefund } from '../models/complaintsApi';
const mockFetch = vi.mocked(fetchComplaints);
const mockReview = vi.mocked(reviewComplaint);
const mockRefund = vi.mocked(approveRefund);

const sampleData = {
  items: [
    {
      id: 'c-1',
      referenceType: 'order' as const,
      referenceId: 'o-1',
      customerName: 'Ana',
      customerEmail: 'ana@test.com',
      customerPhone: null,
      reason: 'Defective',
      status: 'received' as const,
      resolutionNotes: null,
      refundRequestId: null,
      createdAt: '2026-07-23T10:00:00Z',
      resolvedAt: null,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

describe('useComplaints controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches complaints on mount', async () => {
    mockFetch.mockResolvedValue(sampleData);
    const { result } = renderHook(() => useComplaints());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.complaints).toHaveLength(1);
  });

  it('calls reviewComplaint and reloads', async () => {
    mockFetch.mockResolvedValue(sampleData);
    mockReview.mockResolvedValue(undefined);
    const { result } = renderHook(() => useComplaints());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.review('c-1');
    });
    expect(mockReview).toHaveBeenCalledWith('c-1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('calls approveRefund and reloads', async () => {
    mockFetch.mockResolvedValue(sampleData);
    mockRefund.mockResolvedValue(undefined);
    const { result } = renderHook(() => useComplaints());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refund('c-1');
    });
    expect(mockRefund).toHaveBeenCalledWith('c-1');
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useComplaints());
    await waitFor(() => expect(result.current.error).toBe('Network error'));
  });
});
