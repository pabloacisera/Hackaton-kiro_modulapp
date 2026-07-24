import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RefreshToken } from '../../../domain/auth/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/auth/repositories/refresh-token.repository.port';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByAdminUserId(adminUserId: string): Promise<RefreshToken[]> {
    const rows = await this.prisma.refreshToken.findMany({
      where: { adminUserId },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const row = await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        adminUserId: token.adminUserId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revoked: token.revoked,
        createdAt: token.createdAt,
      },
    });
    return this.toDomain(row);
  }

  async update(token: RefreshToken): Promise<RefreshToken> {
    const row = await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: {
        revoked: token.revoked,
      },
    });
    return this.toDomain(row);
  }

  async revokeAllForUser(adminUserId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { adminUserId, revoked: false },
      data: { revoked: true },
    });
  }

  private toDomain(row: {
    id: string;
    adminUserId: string;
    tokenHash: string;
    expiresAt: Date;
    revoked: boolean;
    createdAt: Date;
  }): RefreshToken {
    return new RefreshToken({
      id: row.id,
      adminUserId: row.adminUserId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revoked: row.revoked,
      createdAt: row.createdAt,
    });
  }
}
