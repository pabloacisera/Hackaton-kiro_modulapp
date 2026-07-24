import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import {
  IAdminUserRepository,
  ADMIN_USER_REPOSITORY,
} from '../../../domain/auth/repositories/admin-user.repository.port';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../../domain/auth/repositories/refresh-token.repository.port';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { JwtService } from '../../../infrastructure/auth/jwt/jwt.service';
import { RefreshCookieService } from '../../../infrastructure/auth/jwt/refresh-cookie.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly cookieService: RefreshCookieService,
  ) {}

  async execute(email: string, password: string, res: Response): Promise<{ accessToken: string }> {
    const user = await this.adminUserRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await user.verifyPassword(password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new ForbiddenException('Account is deactivated');
    }

    const rawToken = crypto.randomUUID();
    const refreshToken = RefreshToken.create(user.id, rawToken);
    await this.refreshTokenRepo.save(refreshToken);

    this.cookieService.setRefreshCookie(res, rawToken);

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
    return { accessToken };
  }
}
