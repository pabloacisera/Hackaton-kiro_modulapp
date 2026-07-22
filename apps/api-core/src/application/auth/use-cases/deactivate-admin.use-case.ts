import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  IAdminUserRepository,
} from '../../../domain/auth/repositories/admin-user.repository.port';

@Injectable()
export class DeactivateAdminUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.adminUserRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`Admin user with id ${id} not found`);
    }

    const deactivated = user.deactivate();
    await this.adminUserRepo.update(deactivated);
  }
}
