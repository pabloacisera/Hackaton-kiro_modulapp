import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

const COOKIE_NAME = 'refresh_token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

@Injectable()
export class RefreshCookieService {
  setRefreshCookie(res: Response, rawToken: string): void {
    res.cookie(COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'strict' : 'lax',
      maxAge: MAX_AGE_MS,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    });
  }

  getRefreshTokenFromCookie(req: Request): string | undefined {
    return req.cookies?.[COOKIE_NAME];
  }
}
