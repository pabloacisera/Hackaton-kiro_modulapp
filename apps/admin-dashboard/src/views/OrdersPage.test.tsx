import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useOrders
const mockAccept = vi.fn();
const mockReject = vi.fn();
vi.mock('../controllers/useOrders', () => ({
  useOrders: () => ({
    orders: [
      {
        id: 'ord-111-222',
        prototypeId: 'p-1',
        priceUsdSnapshot: 199.99,
        customerEmail: 'buyer@test.com',
        customerName: 'Alice',
        status: 'paid_pending_acceptance',
        rejectionReason: null,
        estimatedDeliveryDate: null,
        paymentServiceRef: 'ref',
        idempotencyKey: 'k',
        createdAt: '2026-07-22T00:00:00Z',
        updatedAt: '2026-07-22T00:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    loading: false,
    error: null,
    statusFilter: undefined,
    setStatusFilter: vi.fn(),
    setPage: vi.fn(),
    accept: mockAccept,
    reject: mockReject,
    reload: vi.fn(),
  }),
}));

import { OrdersPage } from './OrdersPage';

describe('OrdersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders order table with order data', () => {
    render(<OrdersPage />);
    expect(screen.getByText('buyer@test.com')).toBeInTheDocument();
    expect(screen.getByText(/199\.99/)).toBeInTheDocument();
    // Status badge in the table — may also appear in select, so use getAllByText
    expect(screen.getAllByText(/Pendiente de aceptación/i).length).toBeGreaterThan(0);
  });

  it('shows Aceptar and Rechazar buttons for pending_acceptance orders', () => {
    render(<OrdersPage />);
    expect(screen.getByRole('button', { name: /accept order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject order/i })).toBeInTheDocument();
  });

  it('opens accept modal on Aceptar click', () => {
    render(<OrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: /accept order/i }));
    expect(screen.getByRole('dialog', { name: /aceptar orden/i })).toBeInTheDocument();
  });

  it('calls accept with orderId and eta', async () => {
    mockAccept.mockResolvedValue(undefined);
    render(<OrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: /accept order/i }));

    const dialog = screen.getByRole('dialog', { name: /aceptar orden/i });
    expect(dialog).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/fecha estimada de entrega/i), {
      target: { value: '2026-09-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmar aceptación/i }));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('ord-111-222', '2026-09-01'));
  });

  it('opens reject modal on Rechazar click', () => {
    render(<OrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: /reject order/i }));
    expect(screen.getByRole('dialog', { name: /rechazar orden/i })).toBeInTheDocument();
  });

  it('calls reject with orderId and reason', async () => {
    mockReject.mockResolvedValue(undefined);
    render(<OrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: /reject order/i }));

    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), {
      target: { value: 'Out of materials' },
    });
    fireEvent.click(screen.getByRole('button', { name: /rechazar y reembolsar/i }));

    await waitFor(() => expect(mockReject).toHaveBeenCalledWith('ord-111-222', 'Out of materials'));
  });
});
