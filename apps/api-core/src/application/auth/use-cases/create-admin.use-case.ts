import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  IAdminUserRepository,
} from '../../../domain/auth/repositories/admin-user.repository.port';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
  ) {}

  async execute(email: string, password: string): Promise<{ id: string; email: string }> {
    const existing = await this.adminUserRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = await AdminUser.create(email, password);
    const saved = await this.adminUserRepo.save(user);

    return { id: saved.id, email: saved.email };
  }
}
