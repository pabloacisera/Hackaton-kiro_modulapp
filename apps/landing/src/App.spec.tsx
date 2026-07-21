import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App (landing)', () => {
  it('renders the Landing heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /landing/i })).toBeInTheDocument();
  });

  it('displays port 3000', () => {
    render(<App />);
    expect(screen.getByText(/3000/)).toBeInTheDocument();
  });
});
