import { AdminUser } from '../entities/admin-user.entity';

export interface IAdminUserRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  save(user: AdminUser): Promise<AdminUser>;
  update(user: AdminUser): Promise<AdminUser>;
}

export const ADMIN_USER_REPOSITORY = Symbol('IAdminUserRepository');
