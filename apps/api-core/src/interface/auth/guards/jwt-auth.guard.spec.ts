import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../../../infrastructure/auth/jwt/jwt.service';

function buildContext(
  authHeader: string | undefined,
  handlerMetadata: Record<string, unknown> = {},
) {
  const request: any = {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    request,
  } as any;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jwtService = {
      verifyAccessToken: jest.fn(),
      generateAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(jwtService, reflector);
  });

  it('unit.jwt-guard.validTokenAllowsRequest — valid token → canActivate returns true, sets request.user', () => {
    const ctx = buildContext('Bearer valid.token.here');
    jwtService.verifyAccessToken.mockReturnValue({
      sub: 'admin-id-123',
      email: 'admin@example.com',
    });

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(ctx.request.user).toEqual({
      sub: 'admin-id-123',
      email: 'admin@example.com',
    });
    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith('valid.token.here');
  });

  it('unit.jwt-guard.missingTokenRedirectsToLogin — no Authorization header → throws UnauthorizedException', () => {
    const ctx = buildContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('unit.jwt-guard.expiredTokenRedirectsToLogin — verifyAccessToken throws → guard throws UnauthorizedException', () => {
    const ctx = buildContext('Bearer expired.token');
    jwtService.verifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
