import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExcelImport } from './useExcelImport';

vi.mock('../models/suppliesApi', () => ({
  importExcelPreview: vi.fn(),
  importExcelConfirm: vi.fn(),
}));

import { importExcelPreview, importExcelConfirm } from '../models/suppliesApi';
const mockPreview = vi.mocked(importExcelPreview);
const mockConfirm = vi.mocked(importExcelConfirm);

describe('useExcelImport controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts at upload step', () => {
    const { result } = renderHook(() => useExcelImport());
    expect(result.current.step).toBe('upload');
    expect(result.current.preview).toBeNull();
  });

  it('transitions to preview step after upload', async () => {
    const previewData = {
      previewId: 'p-1',
      toCreate: [{ sku: 'NEW-1', name: 'New Item', action: 'create' as const }],
      toUpdate: [],
      errors: [],
    };
    mockPreview.mockResolvedValue(previewData);

    const { result } = renderHook(() => useExcelImport());
    await act(async () => {
      await result.current.uploadData([
        {
          sku: 'NEW-1',
          name: 'New Item',
          unit: 'unit',
          current_qty: 10,
          min_stock: 5,
          unit_cost_usd: 3,
        },
      ]);
    });

    expect(result.current.step).toBe('preview');
    expect(result.current.preview?.toCreate).toHaveLength(1);
  });

  it('transitions to done step after confirm', async () => {
    mockPreview.mockResolvedValue({ previewId: 'p-2', toCreate: [], toUpdate: [], errors: [] });
    mockConfirm.mockResolvedValue({ applied: 3, errors: [] });

    const { result } = renderHook(() => useExcelImport());
    await act(async () => {
      await result.current.uploadData([]);
    });
    await act(async () => {
      await result.current.confirm();
    });

    expect(result.current.step).toBe('done');
    expect(result.current.confirmResult?.applied).toBe(3);
  });

  it('sets error on preview failure', async () => {
    mockPreview.mockRejectedValue(new Error('Parse error'));
    const { result } = renderHook(() => useExcelImport());

    await act(async () => {
      await result.current.uploadData([]);
    });
    expect(result.current.error).toBe('Parse error');
    expect(result.current.step).toBe('upload');
  });

  it('resets state correctly', async () => {
    mockPreview.mockResolvedValue({ previewId: 'p-3', toCreate: [], toUpdate: [], errors: [] });
    const { result } = renderHook(() => useExcelImport());

    await act(async () => {
      await result.current.uploadData([]);
    });
    expect(result.current.step).toBe('preview');

    act(() => {
      result.current.reset();
    });
    expect(result.current.step).toBe('upload');
    expect(result.current.preview).toBeNull();
  });
});
