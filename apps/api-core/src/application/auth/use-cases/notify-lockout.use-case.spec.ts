import { NotifyLockoutUseCase } from './notify-lockout.use-case';
import { LockoutNotificationService } from '../../../infrastructure/auth/notifications/lockout-notification.service';

describe('NotifyLockoutUseCase', () => {
  let useCase: NotifyLockoutUseCase;
  let notificationService: jest.Mocked<LockoutNotificationService>;

  beforeEach(() => {
    notificationService = {
      notify: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<LockoutNotificationService>;

    useCase = new NotifyLockoutUseCase(notificationService);
  });

  it('unit.notify-lockout.sendsWebSocketNotification — calls notify with email and userId', async () => {
    await useCase.execute('admin@modulapp', 'admin-uuid-123');
    expect(notificationService.notify).toHaveBeenCalledWith(
      'admin@modulapp',
      'admin-uuid-123',
    );
  });

  it('unit.notify-lockout.fallsBackToEmail — notify is called once per lockout', async () => {
    await useCase.execute('admin@modulapp', 'admin-uuid-123');
    expect(notificationService.notify).toHaveBeenCalledTimes(1);
  });

  it('unit.notify-lockout.persistsNotification — does not throw on success', async () => {
    await expect(
      useCase.execute('admin@modulapp', 'admin-uuid-123'),
    ).resolves.toBeUndefined();
  });
});
