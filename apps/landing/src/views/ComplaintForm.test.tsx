import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintForm } from './ComplaintForm';

vi.mock('../models/complaintsApi', () => ({ createComplaint: vi.fn() }));

import { createComplaint } from '../models/complaintsApi';
const mockCreate = vi.mocked(createComplaint);

describe('ComplaintForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all required fields', () => {
    render(<ComplaintForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  it('submit button is disabled when required fields empty', () => {
    render(<ComplaintForm onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /submit complaint/i })).toBeDisabled();
  });

  it('calls createComplaint on submit', async () => {
    mockCreate.mockResolvedValue({ status: 'received', message: 'ok', complaintId: 'c-1' });
    const onSuccess = vi.fn();
    render(<ComplaintForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Defective' } });
    fireEvent.click(screen.getByRole('button', { name: /submit complaint/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('c-1'));
  });

  it('shows error on API failure', async () => {
    mockCreate.mockRejectedValue(new Error('Server error'));
    render(<ComplaintForm onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Issue' } });
    fireEvent.click(screen.getByRole('button', { name: /submit complaint/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('hides reference ID when type is unknown', () => {
    render(<ComplaintForm onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/reference type/i), { target: { value: 'unknown' } });
    expect(screen.queryByLabelText(/order\/quote id/i)).not.toBeInTheDocument();
  });
});
