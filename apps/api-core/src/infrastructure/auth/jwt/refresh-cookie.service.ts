import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

const COOKIE_NAME = 'refresh_token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

@Injectable()
export class RefreshCookieService {
  setRefreshCookie(res: Response, rawToken: string): void {
    res.cookie(COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: MAX_AGE_MS,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  getRefreshTokenFromCookie(req: Request): string | undefined {
    return req.cookies?.[COOKIE_NAME];
  }
}
