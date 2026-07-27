import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SideNav } from './SideNav';

vi.mock('../../controllers/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQG1vZHVsYS5hcHAifQ.fake',
  }),
}));

describe('SideNav', () => {
  it('renders all nav links', () => {
    render(
      <MemoryRouter>
        <SideNav open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Órdenes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cotizaciones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Suministros/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reclamos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Entregas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notificaciones/i })).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked on mobile', () => {
    const onClose = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <SideNav open={true} onClose={onClose} />
      </MemoryRouter>,
    );
    const overlay = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is hidden when open=false', () => {
    render(
      <MemoryRouter>
        <SideNav open={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav.className).toMatch(/-translate-x-full/);
  });

  it('is visible when open=true', () => {
    render(
      <MemoryRouter>
        <SideNav open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav.className).toMatch(/translate-x-0/);
  });
});
