import { UnauthorizedException } from '@nestjs/common';
import { RefreshUseCase } from './refresh.use-case';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';

describe('RefreshUseCase', () => {
  let useCase: RefreshUseCase;
  let refreshTokenRepo: {
    findByTokenHash: jest.Mock;
    findByAdminUserId: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  let adminUserRepo: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { generateAccessToken: jest.Mock; verifyAccessToken: jest.Mock };
  let cookieService: { setRefreshCookie: jest.Mock; clearRefreshCookie: jest.Mock; getRefreshTokenFromCookie: jest.Mock };
  let mockReq: { cookies: Record<string, string> };
  let mockRes: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    refreshTokenRepo = {
      findByTokenHash: jest.fn(),
      findByAdminUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    adminUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    jwtService = {
      generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
      verifyAccessToken: jest.fn(),
    };
    cookieService = {
      setRefreshCookie: jest.fn(),
      clearRefreshCookie: jest.fn(),
      getRefreshTokenFromCookie: jest.fn(),
    };
    mockReq = { cookies: { refresh_token: 'raw-token-value' } };
    mockRes = { cookie: jest.fn(), clearCookie: jest.fn() };

    useCase = new RefreshUseCase(
      refreshTokenRepo as any,
      adminUserRepo as any,
      jwtService as any,
      cookieService as any,
    );
  });

  it('unit.refresh.validTokenReturnsNewJWT', async () => {
    const rawToken = 'raw-token-value';
    cookieService.getRefreshTokenFromCookie.mockReturnValue(rawToken);

    const mockToken = {
      id: 'token-id',
      adminUserId: 'user-123',
      tokenHash: RefreshToken.hashToken(rawToken),
      revoked: false,
      isExpired: jest.fn().mockReturnValue(false),
    } as unknown as RefreshToken;

    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
    } as unknown as AdminUser;

    refreshTokenRepo.findByTokenHash.mockResolvedValue(mockToken);
    adminUserRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute(mockReq as any, mockRes as any);

    expect(result).toEqual({ accessToken: 'new-access-token' });
    expect(jwtService.generateAccessToken).toHaveBeenCalledWith('user-123', 'admin@example.com');
  });

  it('unit.refresh.expiredTokenThrows', async () => {
    const rawToken = 'raw-token-value';
    cookieService.getRefreshTokenFromCookie.mockReturnValue(rawToken);

    const mockToken = {
      id: 'token-id',
      adminUserId: 'user-123',
      revoked: false,
      isExpired: jest.fn().mockReturnValue(true),
    } as unknown as RefreshToken;

    refreshTokenRepo.findByTokenHash.mockResolvedValue(mockToken);

    await expect(
      useCase.execute(mockReq as any, mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('unit.refresh.revokedTokenThrows', async () => {
    const rawToken = 'raw-token-value';
    cookieService.getRefreshTokenFromCookie.mockReturnValue(rawToken);

    const mockToken = {
      id: 'token-id',
      adminUserId: 'user-123',
      revoked: true,
      isExpired: jest.fn().mockReturnValue(false),
    } as unknown as RefreshToken;

    refreshTokenRepo.findByTokenHash.mockResolvedValue(mockToken);

    await expect(
      useCase.execute(mockReq as any, mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });
});
