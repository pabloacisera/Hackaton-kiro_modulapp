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
    expect(screen.getByRole('link', { name: /catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /órdenes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cotizaciones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /suministros/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reclamos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entregas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notificaciones/i })).toBeInTheDocument();
  });

  it('renders mobile menu button on small screens', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /abrir menú de navegación/i })).toBeInTheDocument();
  });

  it('opens side nav when menu button is clicked', () => {
    renderLayout();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav.className).toMatch(/-translate-x-full/);
    fireEvent.click(screen.getByRole('button', { name: /abrir menú de navegación/i }));
    expect(nav.className).toMatch(/translate-x-0/);
  });

  it('renders outlet content', () => {
    renderLayout();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders help button', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /abrir panel de ayuda/i })).toBeInTheDocument();
  });
});
