import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentSuccessScreen, PaymentCancelledScreen } from './PaymentResultScreen';

describe('PaymentSuccessScreen', () => {
  it('shows order ID (truncated) and customer email', () => {
    render(
      <PaymentSuccessScreen
        orderId="abcdef12-0000-0000-0000-000000000000"
        customerEmail="c@test.com"
        onBackToCatalog={vi.fn()}
      />
    );
    expect(screen.getByText(/ABCDEF12/)).toBeInTheDocument();
    expect(screen.getByText(/c@test\.com/)).toBeInTheDocument();
  });

  it('calls onBackToCatalog', () => {
    const fn = vi.fn();
    render(
      <PaymentSuccessScreen orderId="id-1" customerEmail="e@t.com" onBackToCatalog={fn} />
    );
    fireEvent.click(screen.getByRole('button', { name: /back to catalog/i }));
    expect(fn).toHaveBeenCalled();
  });
});

describe('PaymentCancelledScreen', () => {
  it('renders cancel message and buttons', () => {
    render(<PaymentCancelledScreen onRetry={vi.fn()} onBackToCatalog={vi.fn()} />);
    expect(screen.getByText(/payment cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry', () => {
    const onRetry = vi.fn();
    render(<PaymentCancelledScreen onRetry={onRetry} onBackToCatalog={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
