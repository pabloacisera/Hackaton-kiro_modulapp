import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';
import { IAdminUserRepository } from '../../../domain/auth/repositories/admin-user.repository.port';

@Injectable()
export class PrismaAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AdminUser | null> {
    const row = await this.prisma.adminUser.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const row = await this.prisma.adminUser.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async save(user: AdminUser): Promise<AdminUser> {
    const props = user.toProps();
    const row = await this.prisma.adminUser.create({
      data: {
        id: props.id,
        email: props.email,
        passwordHash: props.passwordHash,
        active: props.active,
        createdAt: props.createdAt,
        lastLoginAt: props.lastLoginAt,
      },
    });
    return this.toDomain(row);
  }

  async update(user: AdminUser): Promise<AdminUser> {
    const props = user.toProps();
    const row = await this.prisma.adminUser.update({
      where: { id: props.id },
      data: {
        email: props.email,
        passwordHash: props.passwordHash,
        active: props.active,
        lastLoginAt: props.lastLoginAt,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    email: string;
    passwordHash: string;
    active: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
  }): AdminUser {
    return new AdminUser({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      active: row.active,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
    });
  }
}
