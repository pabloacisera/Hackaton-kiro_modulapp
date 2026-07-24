import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App (landing)', () => {
  it('renders the navigation with Modula brand', () => {
    render(<App />);
    expect(screen.getAllByText('Modula').length).toBeGreaterThan(0);
  });

  it('renders catalog link', () => {
    render(<App />);
    expect(screen.getAllByText('Catalog').length).toBeGreaterThan(0);
  });
});
