import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuppliesPage } from './SuppliesPage';

vi.mock('../controllers/useSupplies', () => ({
  useSupplies: vi.fn(),
}));

import { useSupplies } from '../controllers/useSupplies';
const mockUseSupplies = vi.mocked(useSupplies);

const baseHook = {
  supplies: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  search: '',
  setSearch: vi.fn(),
  belowMinOnly: false,
  setBelowMinOnly: vi.fn(),
  setPage: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  reload: vi.fn(),
};

const sampleSupply = {
  id: 's-1',
  sku: 'MDF-001',
  name: 'MDF Board 18mm',
  unit: 'm2',
  currentQty: 50,
  minStock: 10,
  unitCostUsd: 12.5,
  supplier: 'AcmeLumber',
  createdAt: '2026-07-23T10:00:00Z',
  updatedAt: '2026-07-23T10:00:00Z',
};

describe('SuppliesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders supplies table with data', () => {
    mockUseSupplies.mockReturnValue({ ...baseHook, supplies: [sampleSupply], total: 1 });
    render(<SuppliesPage />);
    expect(screen.getByText('MDF-001')).toBeInTheDocument();
    expect(screen.getByText('MDF Board 18mm')).toBeInTheDocument();
    expect(screen.getByText('AcmeLumber')).toBeInTheDocument();
  });

  it('shows empty state when no supplies', () => {
    mockUseSupplies.mockReturnValue(baseHook);
    render(<SuppliesPage />);
    expect(screen.getByText(/no supplies found/i)).toBeInTheDocument();
  });

  it('shows Add Supply button that opens form', () => {
    mockUseSupplies.mockReturnValue(baseHook);
    render(<SuppliesPage />);
    fireEvent.click(screen.getByRole('button', { name: /add supply/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
  });

  it('shows Edit button that opens form with data', () => {
    mockUseSupplies.mockReturnValue({ ...baseHook, supplies: [sampleSupply], total: 1 });
    render(<SuppliesPage />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('MDF Board 18mm');
  });

  it('calls remove on Delete click', () => {
    const mockRemove = vi.fn();
    mockUseSupplies.mockReturnValue({
      ...baseHook,
      supplies: [sampleSupply],
      total: 1,
      remove: mockRemove,
    });
    render(<SuppliesPage />);
    fireEvent.click(screen.getByText('Delete'));
    expect(mockRemove).toHaveBeenCalledWith('s-1');
  });

  it('highlights below-minimum rows', () => {
    const belowMin = { ...sampleSupply, currentQty: 3 }; // 3 < 10
    mockUseSupplies.mockReturnValue({ ...baseHook, supplies: [belowMin], total: 1 });
    render(<SuppliesPage />);
    // The row should have bg-red-50 class
    const row = screen.getByText('MDF-001').closest('tr');
    expect(row?.className).toContain('bg-red-50');
  });

  it('shows error state', () => {
    mockUseSupplies.mockReturnValue({ ...baseHook, error: 'Network error' });
    render(<SuppliesPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });
});
