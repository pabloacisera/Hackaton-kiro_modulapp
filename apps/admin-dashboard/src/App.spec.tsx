import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock useAuth to simulate unauthenticated state (shows login page)
vi.mock('./controllers/useAuth', () => ({
  useAuth: () => ({
    accessToken: null,
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('App (admin-dashboard)', () => {
  it('renders login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<App />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
