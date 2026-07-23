import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { AdminNotification } from './domain/admin-notification.entity';

describe('Notifications Module — Integration Tests', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('notifyAdmins', () => {
    it('creates notification and returns it', async () => {
      const notif = await service.notifyAdmins(
        'new_purchase',
        'New order from ana@test.com',
        '/admin/orders/ord-1',
      );
      expect(notif.id).toBeDefined();
      expect(notif.type).toBe('new_purchase');
      expect(notif.message).toContain('ana@test.com');
      expect(notif.read).toBe(false);
    });

    it('broadcasts to registered listener', async () => {
      const received: AdminNotification[] = [];
      service.registerBroadcast((n) => received.push(n));

      await service.notifyAdmins('new_complaint', 'Complaint received', '/admin/complaints/c-1');
      expect(received).toHaveLength(1);
      expect(received[0].type).toBe('new_complaint');
    });
  });

  describe('findUnread', () => {
    it('returns only unread notifications', async () => {
      await service.notifyAdmins('new_purchase', 'msg1', '/url1');
      const n2 = await service.notifyAdmins('new_quote_request', 'msg2', '/url2');
      await service.markRead(n2.id);

      const unread = await service.findUnread();
      expect(unread).toHaveLength(1);
      expect(unread[0].message).toBe('msg1');
    });
  });

  describe('markRead', () => {
    it('marks notification as read', async () => {
      const notif = await service.notifyAdmins('low_stock_minimum', 'Low stock', '/url');
      const marked = await service.markRead(notif.id);
      expect(marked!.read).toBe(true);
    });

    it('returns null for non-existent ID', async () => {
      const result = await service.markRead('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all notifications', async () => {
      await service.notifyAdmins('new_purchase', 'a', '/1');
      await service.notifyAdmins('new_complaint', 'b', '/2');
      await service.notifyAdmins('payment_confirmed', 'c', '/3');

      const all = await service.findAll();
      expect(all).toHaveLength(3);
    });

    it('filters by read status', async () => {
      const n1 = await service.notifyAdmins('new_purchase', 'a', '/1');
      await service.notifyAdmins('new_complaint', 'b', '/2');
      await service.markRead(n1.id);

      const readOnly = await service.findAll(true);
      expect(readOnly).toHaveLength(1);
      expect(readOnly[0].message).toBe('a');

      const unreadOnly = await service.findAll(false);
      expect(unreadOnly).toHaveLength(1);
      expect(unreadOnly[0].message).toBe('b');
    });
  });
});
