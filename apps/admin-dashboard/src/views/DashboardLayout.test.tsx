import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

vi.mock('../controllers/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQG1vZHVsYS5hcHAifQ.fake',
  }),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardLayout', () => {
  it('renders all 7 nav section links', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: /catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /supplies/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /complaints/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /deliveries/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
  });

  it('renders mobile menu button on small screens', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /open navigation/i })).toBeInTheDocument();
  });

  it('opens side nav when menu button is clicked', () => {
    renderLayout();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav.className).toMatch(/-translate-x-full/);
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(nav.className).toMatch(/translate-x-0/);
  });

  it('renders outlet content', () => {
    renderLayout();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders help button', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /open help/i })).toBeInTheDocument();
  });
});
