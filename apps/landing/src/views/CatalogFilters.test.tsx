import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CatalogFilters } from './CatalogFilters';

describe('CatalogFilters', () => {
  it('renders search input', () => {
    render(<CatalogFilters filter={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  });

  it('renders category select', () => {
    render(<CatalogFilters filter={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onFilterChange with category when category changes', () => {
    const onChange = vi.fn();
    render(<CatalogFilters filter={{}} onFilterChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'arches' } });
    expect(onChange).toHaveBeenCalledWith({ category: 'arches' });
  });

  it('calls onFilterChange with search query when typing', () => {
    const onChange = vi.fn();
    render(<CatalogFilters filter={{}} onFilterChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'arch' } });
    expect(onChange).toHaveBeenCalledWith({ q: 'arch' });
  });

  it('applies price range on Apply button click', () => {
    const onChange = vi.fn();
    render(<CatalogFilters filter={{}} onFilterChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/minimum price/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/maximum price/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onChange).toHaveBeenCalledWith({ minPrice: 100, maxPrice: 500 });
  });
});
