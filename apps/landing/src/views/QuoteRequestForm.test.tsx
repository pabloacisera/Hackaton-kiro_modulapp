import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteRequestForm } from './QuoteRequestForm';

vi.mock('../models/quotesApi', () => ({
  createQuoteRequest: vi.fn(),
}));

import { createQuoteRequest } from '../models/quotesApi';
const mockCreate = vi.mocked(createQuoteRequest);

describe('QuoteRequestForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all mandatory fields', () => {
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('submit button is disabled when mandatory fields are empty', () => {
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled();
  });

  it('submit button is enabled when name, email, phone are filled', () => {
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '123' } });
    expect(screen.getByRole('button', { name: /submit request/i })).not.toBeDisabled();
  });

  it('calls createQuoteRequest with correct payload on submit', async () => {
    mockCreate.mockResolvedValue({ status: 'pending', message: 'ok', quoteId: 'q-1' });
    const onSuccess = vi.fn();
    render(<QuoteRequestForm onSuccess={onSuccess} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'c@test.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+54 11 555' } });
    fireEvent.change(
      screen
        .getByText(/what do you need/i)
        .closest('div')!
        .querySelector('textarea')!,
      {
        target: { value: 'Custom arch' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Carlos',
          customerEmail: 'c@test.com',
          customerPhone: '+54 11 555',
          description: 'Custom arch',
        }),
      ),
    );
    expect(onSuccess).toHaveBeenCalledWith('q-1');
  });

  it('shows error when API fails', async () => {
    mockCreate.mockRejectedValue(new Error('Server error'));
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('shows discarded message from API', async () => {
    mockCreate.mockResolvedValue({
      status: 'discarded',
      message: 'Missing required info',
      quoteId: 'q-2',
    });
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Missing required info'),
    );
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<QuoteRequestForm onSuccess={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
