import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationBell } from './NotificationBell';

describe('NotificationBell', () => {
  it('renders bell button', () => {
    render(<NotificationBell unreadCount={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    render(<NotificationBell unreadCount={3} onClick={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    render(<NotificationBell unreadCount={0} onClick={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows 9+ for counts above 9', () => {
    render(<NotificationBell unreadCount={10} onClick={vi.fn()} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<NotificationBell unreadCount={1} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
