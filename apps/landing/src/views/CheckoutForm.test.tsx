import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutForm } from './CheckoutForm';
import type { PrototypeDto } from '../models/catalogApi';

vi.mock('../models/ordersApi', () => ({
  createOrder: vi.fn(),
}));

import { createOrder } from '../models/ordersApi';
const mockCreate = vi.mocked(createOrder);

const proto: PrototypeDto = {
  id: 'p-1',
  name: 'Test Arch',
  category: 'arches',
  priceUsd: 199.99,
  active: true,
  stockQty: 3,
  buildOnDemand: false,
  description: 'desc',
  estimatedDeliveryDays: 7,
  images: [],
};

describe('CheckoutForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders email field and prototype price', () => {
    render(<CheckoutForm prototype={proto} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByText(/199\.99/)).toBeInTheDocument();
  });

  it('submit button is disabled when email is empty', () => {
    render(<CheckoutForm prototype={proto} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /pagar con paypal/i })).toBeDisabled();
  });

  it('calls createOrder with correct payload on submit', async () => {
    mockCreate.mockResolvedValue({ orderId: 'ord-1', paymentLink: 'https://paypal.com' });
    const onSuccess = vi.fn();
    render(<CheckoutForm prototype={proto} onSuccess={onSuccess} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'c@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /pagar con paypal/i }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        prototypeId: 'p-1',
        customerEmail: 'c@test.com',
        customerName: undefined,
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith('ord-1', 'https://paypal.com');
  });

  it('shows error when API fails', async () => {
    mockCreate.mockRejectedValue(new Error('Out of stock'));
    render(<CheckoutForm prototype={proto} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'c@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /pagar con paypal/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Out of stock'));
  });

  it('calls onCancel when Cancelar is clicked', () => {
    const onCancel = vi.fn();
    render(<CheckoutForm prototype={proto} onSuccess={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
