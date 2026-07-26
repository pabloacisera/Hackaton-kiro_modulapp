import { useState, useCallback } from 'react';
import {
  importCatalogExcelPreview,
  importCatalogExcelConfirm,
  CatalogImportPreviewResponse,
  CatalogConfirmImportResponse,
} from '../models/catalogApi';

export interface UseCatalogExcelImportResult {
  step: 'upload' | 'preview' | 'done';
  preview: CatalogImportPreviewResponse | null;
  confirmResult: CatalogConfirmImportResponse | null;
  loading: boolean;
  error: string | null;
  uploadData: (rows: Record<string, unknown>[]) => Promise<void>;
  confirm: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing the catalog Excel import wizard flow.
 * Upload → Preview (colored diff) → Confirm → Done.
 */
export function useCatalogExcelImport(): UseCatalogExcelImportResult {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [preview, setPreview] = useState<CatalogImportPreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<CatalogConfirmImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadData = useCallback(async (rows: Record<string, unknown>[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importCatalogExcelPreview(rows);
      setPreview(result);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  }, []);

  const confirm = useCallback(async () => {
    if (!preview?.previewId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await importCatalogExcelConfirm(preview.previewId);
      setConfirmResult(result);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la importación');
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
