import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RouteGuard } from './RouteGuard';

describe('RouteGuard', () => {
  it('renders children when accessToken is present', () => {
    render(
      <MemoryRouter>
        <RouteGuard accessToken="valid-token">
          <div>Protected content</div>
        </RouteGuard>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /login when accessToken is null', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <RouteGuard accessToken={null}>
                <div>Protected content</div>
              </RouteGuard>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
