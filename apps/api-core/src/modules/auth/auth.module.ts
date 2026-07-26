import { Module, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from '../notifications/notifications.module';
import { QUEUE_EMAIL_SEND } from '../../infrastructure/queue/queue.constants';

// Controllers
import { AuthController } from '../../interface/auth/controllers/auth.controller';
import { AdminUserController } from '../../interface/auth/controllers/admin-user.controller';
import { RegistrationController } from '../../interface/auth/controllers/registration.controller';
import { SettingsController } from '../../interface/auth/controllers/settings.controller';

// Guards
import { JwtAuthGuard } from '../../interface/auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../interface/auth/guards/rate-limit.guard';

// Use cases
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RefreshUseCase } from '../../application/auth/use-cases/refresh.use-case';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.use-case';
import { CreateAdminUseCase } from '../../application/auth/use-cases/create-admin.use-case';
import { DeactivateAdminUseCase } from '../../application/auth/use-cases/deactivate-admin.use-case';
import { NotifyLockoutUseCase } from '../../application/auth/use-cases/notify-lockout.use-case';
import { GenerateInviteCodeUseCase } from '../../application/auth/use-cases/generate-invite-code.use-case';
import { InitiateRegistrationUseCase } from '../../application/auth/use-cases/initiate-registration.use-case';
import { VerifyInviteCodeUseCase } from '../../application/auth/use-cases/verify-invite-code.use-case';
import { CompleteRegistrationUseCase } from '../../application/auth/use-cases/complete-registration.use-case';

// Infrastructure
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { RefreshCookieService } from '../../infrastructure/auth/jwt/refresh-cookie.service';
import { RateLimitService } from '../../infrastructure/auth/rate-limit/rate-limit.service';
import { LockoutNotificationService } from '../../infrastructure/auth/notifications/lockout-notification.service';

// Repository tokens
import { ADMIN_USER_REPOSITORY } from '../../domain/auth/repositories/admin-user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/auth/repositories/refresh-token.repository.port';

// Prisma implementations
import { PrismaAdminUserRepository } from '../../infrastructure/prisma/repositories/prisma-admin-user.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/prisma/repositories/prisma-refresh-token.repository';

/**
 * Auth module — handles admin authentication, registration via invitation, and settings.
 */
@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    BullModule.registerQueue({ name: QUEUE_EMAIL_SEND }),
  ],
  controllers: [AuthController, AdminUserController, RegistrationController, SettingsController],
  providers: [
    // Repository bindings
    { provide: ADMIN_USER_REPOSITORY, useClass: PrismaAdminUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },

    // Infrastructure
    JwtService,
    RefreshCookieService,
    RateLimitService,
    LockoutNotificationService,
    Reflector,

    // Use cases
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    CreateAdminUseCase,
    DeactivateAdminUseCase,
    NotifyLockoutUseCase,
    GenerateInviteCodeUseCase,
    InitiateRegistrationUseCase,
    VerifyInviteCodeUseCase,
    CompleteRegistrationUseCase,

    // Guards
    JwtAuthGuard,
    RateLimitGuard,
  ],
  exports: [JwtAuthGuard, JwtService, ADMIN_USER_REPOSITORY],
})
export class AuthModule {}
