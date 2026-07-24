import * as argon2 from 'argon2';

export interface AdminUserProps {
  id: string;
  email: string;
  passwordHash: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export class AdminUser {
  readonly id: string;
  readonly email: string;
  private readonly passwordHash: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;

  constructor(props: AdminUserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.lastLoginAt = props.lastLoginAt;
  }

  static async create(email: string, plainPassword: string): Promise<AdminUser> {
    if (!plainPassword || plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const hash = await argon2.hash(plainPassword);
    return new AdminUser({
      id: crypto.randomUUID(),
      email,
      passwordHash: hash,
      active: true,
      createdAt: new Date(),
      lastLoginAt: null,
    });
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return argon2.verify(this.passwordHash, plainPassword);
  }

  deactivate(): AdminUser {
    return new AdminUser({ ...this.toProps(), active: false });
  }

  recordLogin(): AdminUser {
    return new AdminUser({ ...this.toProps(), lastLoginAt: new Date() });
  }

  toProps(): AdminUserProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      active: this.active,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
}
