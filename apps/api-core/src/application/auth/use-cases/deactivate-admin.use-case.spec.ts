import { NotFoundException } from '@nestjs/common';
import { DeactivateAdminUseCase } from './deactivate-admin.use-case';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';

describe('DeactivateAdminUseCase', () => {
  let useCase: DeactivateAdminUseCase;
  let adminUserRepo: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    adminUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    useCase = new DeactivateAdminUseCase(adminUserRepo as any);
  });

  it('unit.deactivate-admin.deactivatesUser', async () => {
    const activeUser = new AdminUser({
      id: 'user-123',
      email: 'admin@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
      active: true,
      createdAt: new Date(),
      lastLoginAt: null,
    });

    adminUserRepo.findById.mockResolvedValue(activeUser);
    adminUserRepo.update.mockImplementation(async (user: AdminUser) => user);

    await useCase.execute('user-123');

    expect(adminUserRepo.update).toHaveBeenCalledTimes(1);
    const updatedUser: AdminUser = adminUserRepo.update.mock.calls[0][0];
    expect(updatedUser.active).toBe(false);
  });

  it('unit.deactivate-admin.deactivatedUserCannotLogin', async () => {
    const activeUser = new AdminUser({
      id: 'user-456',
      email: 'admin2@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
      active: true,
      createdAt: new Date(),
      lastLoginAt: null,
    });

    adminUserRepo.findById.mockResolvedValue(activeUser);
    adminUserRepo.update.mockImplementation(async (user: AdminUser) => user);

    await useCase.execute('user-456');

    const deactivatedUser: AdminUser = adminUserRepo.update.mock.calls[0][0];
    expect(deactivatedUser.active).toBe(false);
    expect(adminUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('throws NotFoundException when user does not exist', async () => {
    adminUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent-id')).rejects.toThrow(NotFoundException);
  });
});
