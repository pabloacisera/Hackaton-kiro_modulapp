import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteActionResult } from './QuoteActionResult';

vi.mock('../models/quotesApi', () => ({
  fetchQuoteAction: vi.fn(),
}));

import { fetchQuoteAction } from '../models/quotesApi';
const mockFetch = vi.mocked(fetchQuoteAction);

describe('QuoteActionResult', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<QuoteActionResult quoteId="q-1" action="accept" token="tok" />);
    expect(screen.getByText(/processing your response/i)).toBeInTheDocument();
  });

  it('shows accepted state with payment link', async () => {
    mockFetch.mockResolvedValue({
      status: 'accepted',
      message: 'Quote accepted! Complete your payment within 24 hours.',
      paymentUrl: 'https://paypal.com/pay/123',
      quoteId: 'q-1',
    });
    render(<QuoteActionResult quoteId="q-1" action="accept" token="tok" />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /quote accepted/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: /complete payment/i })).toHaveAttribute(
      'href',
      'https://paypal.com/pay/123',
    );
  });

  it('shows rejected state', async () => {
    mockFetch.mockResolvedValue({
      status: 'rejected',
      message: 'Quote rejected. Thank you for letting us know.',
      quoteId: 'q-1',
    });
    render(<QuoteActionResult quoteId="q-1" action="reject" token="tok" />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /quote rejected/i })).toBeInTheDocument(),
    );
  });

  it('shows expired link state', async () => {
    mockFetch.mockResolvedValue({
      status: 'expired',
      message: 'This quote has expired. Please request a new one.',
    });
    render(<QuoteActionResult quoteId="q-1" action="accept" token="tok" />);

    await waitFor(() => expect(screen.getByText(/link expired/i)).toBeInTheDocument());
    expect(screen.getByText(/please contact us/i)).toBeInTheDocument();
  });

  it('shows already processed state', async () => {
    mockFetch.mockResolvedValue({
      status: 'payment_initiated',
      message: 'This action has already been processed.',
    });
    render(<QuoteActionResult quoteId="q-1" action="accept" token="tok" />);

    await waitFor(() => expect(screen.getByText(/already processed/i)).toBeInTheDocument());
  });

  it('shows error state on API failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<QuoteActionResult quoteId="q-1" action="accept" token="tok" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('calls fetchQuoteAction with correct params', async () => {
    mockFetch.mockResolvedValue({ status: 'rejected', message: 'ok' });
    render(<QuoteActionResult quoteId="q-99" action="reject" token="my-token" />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('q-99', 'reject', 'my-token'));
  });
});
