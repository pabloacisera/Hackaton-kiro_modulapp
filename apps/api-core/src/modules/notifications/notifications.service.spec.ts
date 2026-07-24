import { NotificationsService } from './notifications.service';
import { AdminNotification } from './domain/admin-notification.entity';

/**
 * In-memory mock of PrismaNotificationRepository for unit tests.
 */
class MockNotificationRepo {
  private notifications: AdminNotification[] = [];

  async save(n: AdminNotification): Promise<AdminNotification> {
    this.notifications.push(n);
    return n;
  }

  async findAll(read?: boolean): Promise<AdminNotification[]> {
    if (read === undefined) return [...this.notifications];
    return this.notifications.filter((n) => n.read === read);
  }

  async findUnread(): Promise<AdminNotification[]> {
    return this.notifications.filter((n) => !n.read);
  }

  async markRead(id: string): Promise<AdminNotification | null> {
    const idx = this.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    const updated = this.notifications[idx].markRead();
    this.notifications[idx] = updated;
    return updated;
  }
}

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    const mockRepo = new MockNotificationRepo();
    service = new NotificationsService(mockRepo as any);
  });

  it('unit.notification.createIncludesCorrectFields — notifyAdmins creates with all fields', async () => {
    const n = await service.notifyAdmins(
      'new_purchase',
      'New order received',
      '/admin/orders/ord-1',
    );
    expect(n.type).toBe('new_purchase');
    expect(n.message).toBe('New order received');
    expect(n.referenceUrl).toBe('/admin/orders/ord-1');
    expect(n.read).toBe(false);
    expect(n.id).toBeDefined();
  });

  it('unit.notification.markRead.propagatesToAllTabs — markRead updates state', async () => {
    const n = await service.notifyAdmins('new_quote_request', 'msg', '/url');
    const updated = await service.markRead(n.id);
    expect(updated?.read).toBe(true);
    const all = await service.findAll();
    expect(all.find((x) => x.id === n.id)?.read).toBe(true);
  });

  it('broadcasts notification via registered broadcast function', async () => {
    const broadcast = jest.fn();
    service.registerBroadcast(broadcast);
    const n = await service.notifyAdmins(
      'new_complaint',
      'Complaint received',
      '/admin/complaints/c-1',
    );
    expect(broadcast).toHaveBeenCalledWith(n);
  });

  it('findUnread returns only unread notifications', async () => {
    const n1 = await service.notifyAdmins('new_purchase', 'm1', '/u1');
    await service.notifyAdmins('new_purchase', 'm2', '/u2');
    await service.markRead(n1.id);
    const unread = await service.findUnread();
    expect(unread).toHaveLength(1);
    expect(unread[0].read).toBe(false);
  });
});
