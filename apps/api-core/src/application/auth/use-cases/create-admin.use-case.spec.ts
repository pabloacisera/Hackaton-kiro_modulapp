import { ConflictException } from '@nestjs/common';
import { CreateAdminUseCase } from './create-admin.use-case';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';

describe('CreateAdminUseCase', () => {
  let useCase: CreateAdminUseCase;
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

    useCase = new CreateAdminUseCase(adminUserRepo as any);
  });

  it('unit.create-admin.validInputCreatesAdmin', async () => {
    adminUserRepo.findByEmail.mockResolvedValue(null);
    adminUserRepo.save.mockImplementation(async (user: AdminUser) => user);

    const result = await useCase.execute('new@example.com', 'password123');

    expect(adminUserRepo.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: expect.any(String),
      email: 'new@example.com',
    });
  });

  it('unit.create-admin.duplicateEmailThrows', async () => {
    const existingUser = new AdminUser({
      id: 'existing-id',
      email: 'existing@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
      active: true,
      createdAt: new Date(),
      lastLoginAt: null,
    });

    adminUserRepo.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute('existing@example.com', 'password123'),
    ).rejects.toThrow(ConflictException);

    await expect(
      useCase.execute('existing@example.com', 'password123'),
    ).rejects.toThrow('Email already in use');
  });

  it('unit.create-admin.hashPasswordBeforeSaving', async () => {
    adminUserRepo.findByEmail.mockResolvedValue(null);

    let savedUser: AdminUser | undefined;
    adminUserRepo.save.mockImplementation(async (user: AdminUser) => {
      savedUser = user;
      return user;
    });

    await useCase.execute('hash@example.com', 'password123');

    expect(savedUser).toBeDefined();
    const props = savedUser!.toProps();
    expect(props.passwordHash).toMatch(/^\$argon2/);
  });
});
