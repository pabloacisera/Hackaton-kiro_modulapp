import { Injectable } from '@nestjs/common';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/auth/repositories/refresh-token.repository.port';

/**
 * In-memory implementation of IRefreshTokenRepository.
 * Used by AuthModule until the Prisma-backed implementation is wired.
 */
@Injectable()
export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokens: Map<string, RefreshToken> = new Map();

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === tokenHash) return token;
    }
    return null;
  }

  async findByAdminUserId(adminUserId: string): Promise<RefreshToken[]> {
    return [...this.tokens.values()].filter((t) => t.adminUserId === adminUserId);
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    this.tokens.set(token.id, token);
    return token;
  }

  async update(token: RefreshToken): Promise<RefreshToken> {
    this.tokens.set(token.id, token);
    return token;
  }

  async revokeAllForUser(adminUserId: string): Promise<void> {
    for (const [id, token] of this.tokens.entries()) {
      if (token.adminUserId === adminUserId) {
        this.tokens.set(id, token.revoke());
      }
    }
  }
}
