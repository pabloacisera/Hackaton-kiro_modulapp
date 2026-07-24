import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infrastructure/auth/rate-limit/rate-limit.service';

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900; // 15 minutes

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip: string = request.ip ?? 'unknown';
    const email: string = request.body?.email ?? 'unknown';
    const key = `rate-limit:login:${ip}:${email}`;

    const blocked = await this.rateLimitService.isBlocked(key, MAX_ATTEMPTS);
    if (blocked) {
      throw new HttpException('Too many login attempts', 429);
    }

    await this.rateLimitService.increment(key, WINDOW_SECONDS);
    return true;
  }
}
