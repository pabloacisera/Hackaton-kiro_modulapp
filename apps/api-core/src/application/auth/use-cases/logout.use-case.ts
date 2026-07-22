import { Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository.port';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { RefreshCookieService } from '../../../infrastructure/auth/jwt/refresh-cookie.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly cookieService: RefreshCookieService,
  ) {}

  async execute(req: Request, res: Response): Promise<void> {
    const rawToken = this.cookieService.getRefreshTokenFromCookie(req);

    if (rawToken) {
      const tokenHash = RefreshToken.hashToken(rawToken);
      const token = await this.refreshTokenRepo.findByTokenHash(tokenHash);
      if (token) {
        const revoked = token.revoke();
        await this.refreshTokenRepo.update(revoked);
      }
    }

    this.cookieService.clearRefreshCookie(res);
  }
}
