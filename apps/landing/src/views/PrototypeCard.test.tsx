import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrototypeCard } from './PrototypeCard';
import type { PrototypeDto } from '../models/catalogApi';

const proto: PrototypeDto = {
  id: 'p-1',
  name: 'Beautiful Arch',
  category: 'arches',
  priceUsd: 249.99,
  active: true,
  stockQty: 2,
  buildOnDemand: false,
  description: 'A wonderful arch for events',
  estimatedDeliveryDays: 14,
  images: [{ id: 'img-1', url: 'https://example.com/arch.jpg', order: 0 }],
};

describe('PrototypeCard', () => {
  it('displays prototype name', () => {
    render(<PrototypeCard prototype={proto} onSelect={vi.fn()} />);
    expect(screen.getByText('Beautiful Arch')).toBeInTheDocument();
  });

  it('displays price', () => {
    render(<PrototypeCard prototype={proto} onSelect={vi.fn()} />);
    expect(screen.getByText(/249\.99/)).toBeInTheDocument();
  });

  it('displays category', () => {
    render(<PrototypeCard prototype={proto} onSelect={vi.fn()} />);
    expect(screen.getByText(/arches/i)).toBeInTheDocument();
  });

  it('displays description', () => {
    render(<PrototypeCard prototype={proto} onSelect={vi.fn()} />);
    expect(screen.getByText(/wonderful arch/i)).toBeInTheDocument();
  });

  it('displays estimated delivery', () => {
    render(<PrototypeCard prototype={proto} onSelect={vi.fn()} />);
    expect(screen.getByText(/~14d/)).toBeInTheDocument();
  });

  it('calls onSelect with prototype id on click', () => {
    const onSelect = vi.fn();
    render(<PrototypeCard prototype={proto} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('link', { name: /view beautiful arch/i }));
    expect(onSelect).toHaveBeenCalledWith('p-1');
  });

  it('shows out of stock badge when no stock and not buildOnDemand', () => {
    render(<PrototypeCard prototype={{ ...proto, stockQty: 0 }} onSelect={vi.fn()} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('does not show out of stock when buildOnDemand=true', () => {
    render(
      <PrototypeCard
        prototype={{ ...proto, stockQty: 0, buildOnDemand: true }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByText(/out of stock/i)).not.toBeInTheDocument();
  });
});
