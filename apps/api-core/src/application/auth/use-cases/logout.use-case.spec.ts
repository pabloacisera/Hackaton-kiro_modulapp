import { LogoutUseCase } from './logout.use-case';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let refreshTokenRepo: {
    findByTokenHash: jest.Mock;
    findByAdminUserId: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  let cookieService: { setRefreshCookie: jest.Mock; clearRefreshCookie: jest.Mock; getRefreshTokenFromCookie: jest.Mock };
  let mockReq: { cookies: Record<string, string> };
  let mockRes: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    refreshTokenRepo = {
      findByTokenHash: jest.fn(),
      findByAdminUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      revokeAllForUser: jest.fn(),
    };
    cookieService = {
      setRefreshCookie: jest.fn(),
      clearRefreshCookie: jest.fn(),
      getRefreshTokenFromCookie: jest.fn(),
    };
    mockReq = { cookies: { refresh_token: 'raw-token-value' } };
    mockRes = { cookie: jest.fn(), clearCookie: jest.fn() };

    useCase = new LogoutUseCase(
      refreshTokenRepo as any,
      cookieService as any,
    );
  });

  it('unit.logout.revokesRefreshToken', async () => {
    const rawToken = 'raw-token-value';
    cookieService.getRefreshTokenFromCookie.mockReturnValue(rawToken);

    const revokedToken = {
      id: 'token-id',
      adminUserId: 'user-123',
      revoked: true,
    } as unknown as RefreshToken;

    const mockToken = {
      id: 'token-id',
      adminUserId: 'user-123',
      revoked: false,
      revoke: jest.fn().mockReturnValue(revokedToken),
    } as unknown as RefreshToken;

    refreshTokenRepo.findByTokenHash.mockResolvedValue(mockToken);

    await useCase.execute(mockReq as any, mockRes as any);

    expect(mockToken.revoke).toHaveBeenCalled();
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(revokedToken);
  });

  it('unit.logout.clearsCookie', async () => {
    // No token in cookie — should still clear
    cookieService.getRefreshTokenFromCookie.mockReturnValue(undefined);

    await useCase.execute(mockReq as any, mockRes as any);

    expect(cookieService.clearRefreshCookie).toHaveBeenCalledWith(mockRes);
  });
});
