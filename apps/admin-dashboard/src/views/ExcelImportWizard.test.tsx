import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExcelImportWizard } from './ExcelImportWizard';

vi.mock('../controllers/useExcelImport', () => ({
  useExcelImport: vi.fn(),
}));

import { useExcelImport } from '../controllers/useExcelImport';
const mockUseExcelImport = vi.mocked(useExcelImport);

const baseHook = {
  step: 'upload' as const,
  preview: null,
  confirmResult: null,
  loading: false,
  error: null,
  uploadData: vi.fn(),
  confirm: vi.fn(),
  reset: vi.fn(),
};

describe('ExcelImportWizard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders upload step with file input', () => {
    mockUseExcelImport.mockReturnValue(baseHook);
    render(<ExcelImportWizard />);
    expect(screen.getByText(/import supplies from excel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload supply file/i)).toBeInTheDocument();
  });

  it('renders preview step with creates and updates', () => {
    mockUseExcelImport.mockReturnValue({
      ...baseHook,
      step: 'preview',
      preview: {
        previewId: 'p-1',
        toCreate: [{ sku: 'NEW-1', name: 'New Item', action: 'create' }],
        toUpdate: [{ sku: 'UPD-1', name: 'Updated', action: 'update' }],
        errors: [{ row: 3, field: 'sku', message: 'Duplicate' }],
      },
    });
    render(<ExcelImportWizard />);
    expect(screen.getByText(/to create/i)).toBeInTheDocument();
    expect(screen.getByText('NEW-1')).toBeInTheDocument();
    expect(screen.getByText(/to update/i)).toBeInTheDocument();
    expect(screen.getByText('UPD-1')).toBeInTheDocument();
    expect(screen.getByText(/errors/i)).toBeInTheDocument();
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
  });

  it('calls confirm on button click', () => {
    const mockConfirm = vi.fn();
    mockUseExcelImport.mockReturnValue({
      ...baseHook,
      step: 'preview',
      preview: {
        previewId: 'p-1',
        toCreate: [{ sku: 'A', name: 'B', action: 'create' }],
        toUpdate: [],
        errors: [],
      },
      confirm: mockConfirm,
    });
    render(<ExcelImportWizard />);
    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }));
    expect(mockConfirm).toHaveBeenCalled();
  });

  it('renders done step with results', () => {
    mockUseExcelImport.mockReturnValue({
      ...baseHook,
      step: 'done',
      confirmResult: { applied: 5, errors: [] },
    });
    render(<ExcelImportWizard />);
    expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    expect(screen.getByText(/5 supplies applied/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseExcelImport.mockReturnValue({
      ...baseHook,
      step: 'preview',
      preview: { previewId: 'p-1', toCreate: [], toUpdate: [], errors: [] },
      error: 'Server failed',
    });
    render(<ExcelImportWizard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server failed');
  });
});
