import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotificationPanel } from './NotificationPanel';
import type { AdminNotification } from '../../controllers/useNotifications';

const notif: AdminNotification = {
  id: 'n-1',
  type: 'new_purchase',
  message: 'New order received',
  referenceUrl: '/admin/orders/ord-1',
  read: false,
  createdAt: new Date().toISOString(),
};

function renderPanel(props: Partial<React.ComponentProps<typeof NotificationPanel>> = {}) {
  return render(
    <MemoryRouter>
      <NotificationPanel
        notifications={[notif]}
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onMarkRead={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('NotificationPanel', () => {
  it('renders notification messages', () => {
    renderPanel();
    expect(screen.getByText('New order received')).toBeInTheDocument();
  });

  it('shows "Sin notificaciones" when list is empty', () => {
    renderPanel({ notifications: [] });
    expect(screen.getByText(/sin notificaciones/i)).toBeInTheDocument();
  });

  it('calls onMarkRead when mark read button is clicked', () => {
    const onMarkRead = vi.fn();
    renderPanel({ onMarkRead });
    fireEvent.click(screen.getByRole('button', { name: /marcar.*leída/i }));
    expect(onMarkRead).toHaveBeenCalledWith('n-1');
  });

  it('calls onToggleSound when sound button is clicked', () => {
    const onToggleSound = vi.fn();
    renderPanel({ notifications: [], onToggleSound });
    fireEvent.click(screen.getByRole('button', { name: /desactivar sonido/i }));
    expect(onToggleSound).toHaveBeenCalled();
  });

  it('does not show mark read button for already-read notifications', () => {
    renderPanel({ notifications: [{ ...notif, read: true }] });
    expect(screen.queryByRole('button', { name: /marcar.*leída/i })).not.toBeInTheDocument();
  });
});
