import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  IAdminUserRepository,
} from '../../../domain/auth/repositories/admin-user.repository.port';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';

@Injectable()
export class CompleteRegistrationUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async execute(
    registrationToken: string,
    password: string,
  ): Promise<{ id: string; email: string }> {
    // 1. Validate registration token exists and is verified
    const regData = await this.redis.get(`admin-reg:${registrationToken}`);
    if (!regData) {
      throw new BadRequestException('Registration link expired or invalid');
    }

    // Redis wrapper may return string or parsed object depending on storage layer
    const registration = typeof regData === 'string' ? JSON.parse(regData) : regData;

    if (!registration.verified) {
      throw new BadRequestException('Invitation code not yet verified');
    }

    // 2. Create the admin user
    const user = await AdminUser.create(registration.email, password);
    const saved = await this.adminUserRepo.save(user);

    // 3. Cleanup: delete the registration token
    await this.redis.del(`admin-reg:${registrationToken}`);

    return { id: saved.id, email: saved.email };
  }
}
