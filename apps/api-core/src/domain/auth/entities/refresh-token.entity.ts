import * as crypto from 'crypto';

export interface RefreshTokenProps {
  id: string;
  adminUserId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

export class RefreshToken {
  readonly id: string;
  readonly adminUserId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revoked: boolean;
  readonly createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.adminUserId = props.adminUserId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revoked = props.revoked;
    this.createdAt = props.createdAt;
  }

  static create(adminUserId: string, rawToken: string, ttlDays = 30): RefreshToken {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    return new RefreshToken({
      id: crypto.randomUUID(),
      adminUserId,
      tokenHash,
      expiresAt,
      revoked: false,
      createdAt: new Date(),
    });
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  revoke(): RefreshToken {
    return new RefreshToken({ ...this, revoked: true });
  }

  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
