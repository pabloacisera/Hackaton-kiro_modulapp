import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotesPage } from './QuotesPage';

vi.mock('../controllers/useQuotes', () => ({
  useQuotes: vi.fn(),
}));

import { useQuotes } from '../controllers/useQuotes';
const mockUseQuotes = vi.mocked(useQuotes);

const baseHook = {
  quotes: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  statusFilter: undefined,
  setStatusFilter: vi.fn(),
  setPage: vi.fn(),
  present: vi.fn(),
  archive: vi.fn(),
  reload: vi.fn(),
};

const pendingQuote = {
  id: 'q-1',
  customerName: 'Carlos López',
  customerEmail: 'carlos@test.com',
  customerPhone: '+54 11 555',
  description: 'Custom arch for wedding',
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
};

const rejectedQuote = {
  ...pendingQuote,
  id: 'q-2',
  status: 'rejected' as const,
  rejectedAt: '2026-07-23T12:00:00Z',
};

describe('QuotesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders quotes table with data', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, quotes: [pendingQuote], total: 1 });
    render(<QuotesPage />);
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
    expect(screen.getByText('carlos@test.com')).toBeInTheDocument();
    expect(screen.getByText(/custom arch for wedding/i)).toBeInTheDocument();
  });

  it('shows "Cotizar" button for pending quotes', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, quotes: [pendingQuote], total: 1 });
    render(<QuotesPage />);
    expect(screen.getByRole('button', { name: /cotizar/i })).toBeInTheDocument();
  });

  it('shows "Archivar" button for rejected quotes', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, quotes: [rejectedQuote], total: 1 });
    render(<QuotesPage />);
    expect(screen.getByRole('button', { name: /archivar/i })).toBeInTheDocument();
  });

  it('opens present modal on button click', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, quotes: [pendingQuote], total: 1 });
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: /cotizar/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiempo de producción/i)).toBeInTheDocument();
  });

  it('calls present with correct values from modal', async () => {
    const mockPresent = vi.fn().mockResolvedValue(undefined);
    mockUseQuotes.mockReturnValue({
      ...baseHook,
      quotes: [pendingQuote],
      total: 1,
      present: mockPresent,
    });
    render(<QuotesPage />);

    fireEvent.click(screen.getByRole('button', { name: /cotizar/i }));
    fireEvent.change(screen.getByLabelText(/precio/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/tiempo de producción/i), { target: { value: '14' } });
    fireEvent.change(screen.getByLabelText(/fecha estimada de entrega/i), {
      target: { value: '2026-10-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar cotización/i }));

    await waitFor(() => expect(mockPresent).toHaveBeenCalledWith('q-1', 250, 14, '2026-10-01'));
  });

  it('shows empty state when no quotes', () => {
    mockUseQuotes.mockReturnValue(baseHook);
    render(<QuotesPage />);
    expect(screen.getByText(/no se encontraron cotizaciones/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, loading: true });
    render(<QuotesPage />);
    expect(screen.getByText(/cargando cotizaciones/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseQuotes.mockReturnValue({ ...baseHook, error: 'Server error' });
    render(<QuotesPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server error');
  });
});
