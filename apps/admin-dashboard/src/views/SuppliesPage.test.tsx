import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('MDF-001')).toBeInTheDocument();
    expect(screen.getByText('MDF Board 18mm')).toBeInTheDocument();
    expect(screen.getByText('AcmeLumber')).toBeInTheDocument();
  });

  it('shows empty state when no supplies', () => {
    mockUseSupplies.mockReturnValue(baseHook);
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('No se encontraron suministros.')).toBeInTheDocument();
  });

  it('shows Add Supply button that opens form', () => {
    mockUseSupplies.mockReturnValue(baseHook);
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /agregar suministro/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
  });

  it('shows Edit button that opens form with data', () => {
    mockUseSupplies.mockReturnValue({ ...baseHook, supplies: [sampleSupply], total: 1 });
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('MDF Board 18mm');
  });

  it('calls remove on Delete click', () => {
    const mockRemove = vi.fn();
    mockUseSupplies.mockReturnValue({
      ...baseHook,
      supplies: [sampleSupply],
      total: 1,
      remove: mockRemove,
    });
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Eliminar'));
    expect(mockRemove).toHaveBeenCalledWith('s-1');
  });

  it('highlights below-minimum rows', () => {
    const belowMin = { ...sampleSupply, currentQty: 3 }; // 3 < 10
    mockUseSupplies.mockReturnValue({ ...baseHook, supplies: [belowMin], total: 1 });
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    // The row should have bg-red-50 class
    const row = screen.getByText('MDF-001').closest('tr');
    expect(row?.className).toContain('bg-red-50');
  });

  it('shows error state', () => {
    mockUseSupplies.mockReturnValue({ ...baseHook, error: 'Network error' });
    render(
      <MemoryRouter>
        <SuppliesPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });
});
