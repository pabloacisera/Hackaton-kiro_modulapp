import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository.port';
import { IAdminUserRepository, ADMIN_USER_REPOSITORY } from '../../../domain/auth/repositories/admin-user.repository.port';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { JwtService } from '../../../infrastructure/auth/jwt/jwt.service';
import { RefreshCookieService } from '../../../infrastructure/auth/jwt/refresh-cookie.service';

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
    private readonly jwtService: JwtService,
    private readonly cookieService: RefreshCookieService,
  ) {}

  async execute(
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const rawToken = this.cookieService.getRefreshTokenFromCookie(req);
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenHash = RefreshToken.hashToken(rawToken);
    const token = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (token.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (token.isExpired()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.adminUserRepo.findById(token.adminUserId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
    return { accessToken };
  }
}
