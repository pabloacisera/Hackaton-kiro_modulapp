import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrototypeDetail } from './PrototypeDetail';
import type { PrototypeDto, CatalogSseEvent } from '../models/catalogApi';

// Mock the catalogApi module
vi.mock('../models/catalogApi', async () => {
  const actual = await vi.importActual('../models/catalogApi');
  return {
    ...actual,
    subscribeCatalogStream: vi.fn(),
  };
});

import { subscribeCatalogStream } from '../models/catalogApi';

const mockSubscribe = subscribeCatalogStream as ReturnType<typeof vi.fn>;

const prototype: PrototypeDto = {
  id: 'p-1',
  name: 'Modular Shelf',
  category: 'modular_furniture',
  priceUsd: 150.0,
  active: true,
  stockQty: 5,
  buildOnDemand: false,
  description: 'A modern modular shelf unit',
  estimatedDeliveryDays: 7,
  images: [{ id: 'img-1', url: 'https://example.com/shelf.jpg', order: 0 }],
};

describe('PrototypeDetail', () => {
  let sseCallback: (event: CatalogSseEvent) => void;
  const cleanup = vi.fn();

  beforeEach(() => {
    mockSubscribe.mockImplementation((onEvent: (e: CatalogSseEvent) => void) => {
      sseCallback = onEvent;
      return cleanup;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders prototype name and price', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Modular Shelf')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('renders description and delivery estimate', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('A modern modular shelf unit')).toBeInTheDocument();
    expect(screen.getByText('Estimated delivery: ~7 days')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('modular furniture')).toBeInTheDocument();
  });

  it('calls onBuy when "Buy now" is clicked', () => {
    const onBuy = vi.fn();
    render(<PrototypeDetail prototype={prototype} onBuy={onBuy} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Buy now'));
    expect(onBuy).toHaveBeenCalledWith('p-1');
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('← Back to catalog'));
    expect(onBack).toHaveBeenCalled();
  });

  it('subscribes to SSE on mount and cleans up on unmount', () => {
    const { unmount } = render(
      <PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />,
    );
    expect(mockSubscribe).toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it('shows deactivation notice when SSE deactivates the prototype', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);

    act(() => {
      sseCallback({ type: 'prototype.deactivated', payload: { id: 'p-1' } });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('This prototype is no longer available.');
    expect(screen.queryByText('Buy now')).not.toBeInTheDocument();
  });

  it('updates price when SSE sends prototype.updated', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);

    act(() => {
      sseCallback({
        type: 'prototype.updated',
        payload: { id: 'p-1', priceUsd: 175.0 },
      });
    });

    expect(screen.getByText('$175.00')).toBeInTheDocument();
  });

  it('ignores SSE events for other prototypes', () => {
    render(<PrototypeDetail prototype={prototype} onBuy={vi.fn()} onBack={vi.fn()} />);

    act(() => {
      sseCallback({ type: 'prototype.deactivated', payload: { id: 'other-id' } });
    });

    // Should NOT show deactivation alert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Buy now')).toBeInTheDocument();
  });

  it('disables buy button when out of stock', () => {
    const outOfStock = { ...prototype, stockQty: 0, buildOnDemand: false };
    render(<PrototypeDetail prototype={outOfStock} onBuy={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
});
