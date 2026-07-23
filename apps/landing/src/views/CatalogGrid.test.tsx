import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CatalogGrid } from './CatalogGrid';
import type { PrototypeDto } from '../models/catalogApi';

const items: PrototypeDto[] = [
  { id: 'p-1', name: 'Arch One', category: 'arches', priceUsd: 199.99,
    active: true, stockQty: 3, buildOnDemand: false,
    description: 'Nice arch', estimatedDeliveryDays: 10, images: [] },
  { id: 'p-2', name: 'Bookshelf B', category: 'modular_furniture', priceUsd: 299.00,
    active: true, stockQty: 0, buildOnDemand: true,
    description: 'Modular shelf', estimatedDeliveryDays: null, images: [] },
];

describe('CatalogGrid', () => {
  it('renders all prototype cards', () => {
    render(<CatalogGrid items={items} loading={false} onSelectPrototype={vi.fn()} />);
    expect(screen.getByText('Arch One')).toBeInTheDocument();
    expect(screen.getByText('Bookshelf B')).toBeInTheDocument();
  });

  it('shows skeleton loading when loading=true', () => {
    render(<CatalogGrid items={[]} loading={true} onSelectPrototype={vi.fn()} />);
    // Skeleton divs are aria-hidden
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items', () => {
    render(<CatalogGrid items={[]} loading={false} onSelectPrototype={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/no prototypes found/i);
  });

  it('renders with accessible catalog label', () => {
    const { container } = render(<CatalogGrid items={items} loading={false} onSelectPrototype={vi.fn()} />);
    expect(container.querySelector('[aria-label="Prototype catalog"]')).toBeTruthy();
  });
});
