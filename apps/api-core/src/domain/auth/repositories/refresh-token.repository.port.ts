import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findByAdminUserId(adminUserId: string): Promise<RefreshToken[]>;
  save(token: RefreshToken): Promise<RefreshToken>;
  update(token: RefreshToken): Promise<RefreshToken>;
  revokeAllForUser(adminUserId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');
