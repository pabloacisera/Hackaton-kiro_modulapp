import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { AdminUser } from '../../../domain/auth/entities/admin-user.entity';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let adminUserRepo: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let refreshTokenRepo: {
    findByTokenHash: jest.Mock;
    findByAdminUserId: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  let jwtService: { generateAccessToken: jest.Mock; verifyAccessToken: jest.Mock };
  let cookieService: { setRefreshCookie: jest.Mock; clearRefreshCookie: jest.Mock; getRefreshTokenFromCookie: jest.Mock };
  let mockRes: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    adminUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    refreshTokenRepo = {
      findByTokenHash: jest.fn(),
      findByAdminUserId: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    jwtService = {
      generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
      verifyAccessToken: jest.fn(),
    };
    cookieService = {
      setRefreshCookie: jest.fn(),
      clearRefreshCookie: jest.fn(),
      getRefreshTokenFromCookie: jest.fn(),
    };
    mockRes = { cookie: jest.fn(), clearCookie: jest.fn() };

    useCase = new LoginUseCase(
      adminUserRepo as any,
      refreshTokenRepo as any,
      jwtService as any,
      cookieService as any,
    );
  });

  it('unit.login.validCredentialsReturnsJWTAndCookie', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      active: true,
      verifyPassword: jest.fn().mockResolvedValue(true),
    } as unknown as AdminUser;

    adminUserRepo.findByEmail.mockResolvedValue(mockUser);
    jest.spyOn(RefreshToken, 'create').mockReturnValue({
      id: 'token-id',
      adminUserId: 'user-123',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
      revoked: false,
      createdAt: new Date(),
      isExpired: () => false,
      revoke: jest.fn(),
    } as unknown as RefreshToken);

    const result = await useCase.execute('admin@example.com', 'password123', mockRes as any);

    expect(result).toEqual({ accessToken: 'mock-access-token' });
    expect(cookieService.setRefreshCookie).toHaveBeenCalledWith(mockRes, expect.any(String));
    expect(jwtService.generateAccessToken).toHaveBeenCalledWith('user-123', 'admin@example.com');
  });

  it('unit.login.invalidCredentialsReturns401', async () => {
    adminUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute('notfound@example.com', 'password123', mockRes as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('unit.login.deactivatedUserReturns403', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      active: false,
      verifyPassword: jest.fn().mockResolvedValue(true),
    } as unknown as AdminUser;

    adminUserRepo.findByEmail.mockResolvedValue(mockUser);

    await expect(
      useCase.execute('admin@example.com', 'password123', mockRes as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
