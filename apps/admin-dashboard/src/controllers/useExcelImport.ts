import { useState, useCallback } from 'react';
import {
  importExcelPreview,
  importExcelConfirm,
  ImportPreviewResponse,
  ConfirmImportResponse,
} from '../models/suppliesApi';

export interface UseExcelImportResult {
  step: 'upload' | 'preview' | 'done';
  preview: ImportPreviewResponse | null;
  confirmResult: ConfirmImportResponse | null;
  loading: boolean;
  error: string | null;
  uploadData: (rows: Record<string, unknown>[]) => Promise<void>;
  confirm: () => Promise<void>;
  reset: () => void;
}

/**
 * TASK-stock-9: useExcelImport controller — manages the two-step import flow.
 * Upload → Preview (colored diff) → Confirm → Done.
 */
export function useExcelImport(): UseExcelImportResult {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadData = useCallback(async (rows: Record<string, unknown>[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importExcelPreview(rows);
      setPreview(result);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, []);

  const confirm = useCallback(async () => {
    if (!preview?.previewId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await importExcelConfirm(preview.previewId);
      setConfirmResult(result);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm import');
    } finally {
      setLoading(false);
    }
  }, [preview]);

  const reset = useCallback(() => {
    setStep('upload');
    setPreview(null);
    setConfirmResult(null);
    setError(null);
  }, []);

  return { step, preview, confirmResult, loading, error, uploadData, confirm, reset };
}
