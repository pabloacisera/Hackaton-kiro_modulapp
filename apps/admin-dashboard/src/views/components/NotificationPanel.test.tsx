import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('NotificationPanel', () => {
  it('renders notification messages', () => {
    render(
      <NotificationPanel
        notifications={[notif]}
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onMarkRead={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('New order received')).toBeInTheDocument();
  });

  it('shows "No notifications" when list is empty', () => {
    render(
      <NotificationPanel
        notifications={[]}
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onMarkRead={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('calls onMarkRead when mark read button is clicked', () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationPanel
        notifications={[notif]}
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onMarkRead={onMarkRead}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark.*read/i }));
    expect(onMarkRead).toHaveBeenCalledWith('n-1');
  });

  it('calls onToggleSound when sound button is clicked', () => {
    const onToggleSound = vi.fn();
    render(
      <NotificationPanel
        notifications={[]}
        soundEnabled={true}
        onToggleSound={onToggleSound}
        onMarkRead={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(onToggleSound).toHaveBeenCalled();
  });

  it('does not show mark read button for already-read notifications', () => {
    render(
      <NotificationPanel
        notifications={[{ ...notif, read: true }]}
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onMarkRead={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /mark.*read/i })).not.toBeInTheDocument();
  });
});
