import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogPage } from './CatalogPage';

vi.mock('../controllers/useCatalog', () => ({
  useCatalog: vi.fn(),
}));

import { useCatalog } from '../controllers/useCatalog';
const mockUseCatalog = vi.mocked(useCatalog);

const mockPrototypes = [
  {
    id: 'p-1',
    name: 'Bookshelf',
    description: 'A modular bookshelf for testing',
    category: 'modular_furniture' as const,
    priceUsd: 149.99,
    active: true,
    stockQty: 10,
    buildOnDemand: false,
    estimatedDeliveryDays: 7,
    images: [{ id: 'img-1', url: '/img.jpg', order: 0 }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-2',
    name: 'Wedding Arch',
    description: 'Elegant arch for events',
    category: 'arches' as const,
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

const baseHook = {
  prototypes: mockPrototypes,
  total: 2,
  page: 1,
  loading: false,
  error: null,
  search: '',
  setSearch: vi.fn(),
  category: '',
  setCategory: vi.fn(),
  setPage: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
  reactivate: vi.fn(),
  reload: vi.fn(),
};

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCatalog.mockReturnValue(baseHook);
  });

  it('renders prototype table with all rows', () => {
    render(<CatalogPage />);

    expect(screen.getByText('Bookshelf')).toBeInTheDocument();
    expect(screen.getByText('Wedding Arch')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('$299.00')).toBeInTheDocument();
  });

  it('shows active/inactive badges', () => {
    render(<CatalogPage />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('shows Deactivate button for active and Reactivate for inactive', () => {
    render(<CatalogPage />);

    expect(screen.getByText('Desactivar')).toBeInTheDocument();
    expect(screen.getByText('Reactivar')).toBeInTheDocument();
  });

  it('opens create form when Add Prototype is clicked', () => {
    render(<CatalogPage />);

    fireEvent.click(screen.getByText('+ Agregar prototipo'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Prototipo')).toBeInTheDocument();
  });

  it('opens edit form when Edit is clicked', () => {
    render(<CatalogPage />);

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar Prototipo')).toBeInTheDocument();
  });

  it('calls deactivate when Deactivate button is clicked', () => {
    render(<CatalogPage />);

    fireEvent.click(screen.getByText('Desactivar'));

    expect(baseHook.deactivate).toHaveBeenCalledWith('p-1');
  });

  it('calls reactivate when Reactivate button is clicked', () => {
    render(<CatalogPage />);

    fireEvent.click(screen.getByText('Reactivar'));

    expect(baseHook.reactivate).toHaveBeenCalledWith('p-2');
  });

  it('shows loading state', () => {
    mockUseCatalog.mockReturnValue({ ...baseHook, prototypes: [], loading: true });

    render(<CatalogPage />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows error alert', () => {
    mockUseCatalog.mockReturnValue({
      ...baseHook,
      prototypes: [],
      error: 'Something went wrong',
    });

    render(<CatalogPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('shows empty state when no prototypes', () => {
    mockUseCatalog.mockReturnValue({ ...baseHook, prototypes: [], total: 0 });

    render(<CatalogPage />);

    expect(screen.getByText('No hay prototipos en el catálogo aún.')).toBeInTheDocument();
  });

  it('shows image count', () => {
    render(<CatalogPage />);

    expect(screen.getByText('1 img')).toBeInTheDocument();
    expect(screen.getByText('0 img')).toBeInTheDocument();
  });

  it('shows on-demand indicator', () => {
    render(<CatalogPage />);

    expect(screen.getByText('(bajo pedido)')).toBeInTheDocument();
  });
});
