import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Controllers
import { AuthController } from '../../interface/auth/controllers/auth.controller';
import { AdminUserController } from '../../interface/auth/controllers/admin-user.controller';

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

// Infrastructure
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { RefreshCookieService } from '../../infrastructure/auth/jwt/refresh-cookie.service';
import { RateLimitService } from '../../infrastructure/auth/rate-limit/rate-limit.service';
import { LockoutNotificationService } from '../../infrastructure/auth/notifications/lockout-notification.service';

// Repository tokens
import { ADMIN_USER_REPOSITORY } from '../../domain/auth/repositories/admin-user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/auth/repositories/refresh-token.repository.port';

// In-memory repository implementations (used until Prisma infra is wired)
import { InMemoryAdminUserRepository } from '../../infrastructure/auth/repositories/in-memory-admin-user.repository';
import { InMemoryRefreshTokenRepository } from '../../infrastructure/auth/repositories/in-memory-refresh-token.repository';

@Module({
  controllers: [AuthController, AdminUserController],
  providers: [
    // Repository bindings
    { provide: ADMIN_USER_REPOSITORY, useClass: InMemoryAdminUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: InMemoryRefreshTokenRepository },

    // Redis stub (real binding wired in feature-realtime-notifications)
    {
      provide: 'REDIS_CLIENT',
      useValue: {
        incr: async () => 1,
        expire: async () => 1,
        get: async () => '0',
        del: async () => 1,
      },
    },

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

    // Guards
    JwtAuthGuard,
    RateLimitGuard,
  ],
  exports: [JwtAuthGuard, JwtService],
})
export class AuthModule {}
