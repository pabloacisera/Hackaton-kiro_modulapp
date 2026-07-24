import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App (landing)', () => {
  it('renders the navigation with ModulApp brand', () => {
    render(<App />);
    expect(screen.getAllByText('ModulApp').length).toBeGreaterThan(0);
  });

  it('renders catalog link', () => {
    render(<App />);
    expect(screen.getAllByText('Catalog').length).toBeGreaterThan(0);
  });
});
