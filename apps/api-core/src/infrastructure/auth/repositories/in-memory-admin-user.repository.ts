import { Injectable } from '@nestjs/common';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';
import { IAdminUserRepository } from '../../../domain/auth/repositories/admin-user.repository.port';

/**
 * In-memory implementation of IAdminUserRepository.
 * Used by AuthModule until the Prisma-backed implementation is wired
 * in feature-admin-auth-core (database migration task).
 */
@Injectable()
export class InMemoryAdminUserRepository implements IAdminUserRepository {
  private readonly users: Map<string, AdminUser> = new Map();

  async findById(id: string): Promise<AdminUser | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async save(user: AdminUser): Promise<AdminUser> {
    this.users.set(user.id, user);
    return user;
  }

  async update(user: AdminUser): Promise<AdminUser> {
    this.users.set(user.id, user);
    return user;
  }
}
