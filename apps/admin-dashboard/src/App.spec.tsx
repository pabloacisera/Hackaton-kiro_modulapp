import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App (admin-dashboard)', () => {
  it('renders the Admin Dashboard heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
  });

  it('displays port 3001', () => {
    render(<App />);
    expect(screen.getByText(/3001/)).toBeInTheDocument();
  });
});
