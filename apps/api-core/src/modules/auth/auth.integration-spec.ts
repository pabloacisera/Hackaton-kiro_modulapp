import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../app.module';
import { AdminUser } from '../../domain/auth/entities/admin-user.entity';
import { RefreshToken } from '../../domain/auth/entities/refresh-token.entity';
import {
  IAdminUserRepository,
  ADMIN_USER_REPOSITORY,
} from '../../domain/auth/repositories/admin-user.repository.port';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/auth/repositories/refresh-token.repository.port';

// ── In-memory repository stubs ──────────────────────────────────────────────

class InMemoryAdminUserRepo implements IAdminUserRepository {
  private users: AdminUser[] = [];

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async save(user: AdminUser) {
    this.users.push(user);
    return user;
  }
  async update(user: AdminUser) {
    this.users = this.users.map((u) => (u.id === user.id ? user : u));
    return user;
  }
  seed(user: AdminUser) {
    this.users.push(user);
  }
}

class InMemoryRefreshTokenRepo implements IRefreshTokenRepository {
  private tokens: RefreshToken[] = [];

  async findByTokenHash(hash: string) {
    return this.tokens.find((t) => t.tokenHash === hash) ?? null;
  }
  async findByAdminUserId(id: string) {
    return this.tokens.filter((t) => t.adminUserId === id);
  }
  async save(token: RefreshToken) {
    this.tokens.push(token);
    return token;
  }
  async update(token: RefreshToken) {
    this.tokens = this.tokens.map((t) => (t.id === token.id ? token : t));
    return token;
  }
  async revokeAllForUser(adminUserId: string) {
    this.tokens = this.tokens.map((t) => (t.adminUserId === adminUserId ? t.revoke() : t));
  }
}

// ── Redis stub ────────────────────────────────────────────────────────────────

const redisMock = {
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  get: jest.fn().mockResolvedValue('0'),
  del: jest.fn().mockResolvedValue(1),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let adminUserRepo: InMemoryAdminUserRepo;
  let refreshTokenRepo: InMemoryRefreshTokenRepo;
  let seededAdmin: AdminUser;

  beforeAll(async () => {
    adminUserRepo = new InMemoryAdminUserRepo();
    refreshTokenRepo = new InMemoryRefreshTokenRepo();

    // Seed one active admin
    seededAdmin = await AdminUser.create('admin@modula.com', 'Password123!');
    adminUserRepo.seed(seededAdmin);

    // Seed one deactivated admin
    const deactivated = await AdminUser.create('deactivated@modula.com', 'Password123!');
    adminUserRepo.seed(deactivated.deactivate());

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ADMIN_USER_REPOSITORY)
      .useValue(adminUserRepo)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(refreshTokenRepo)
      .overrideProvider('REDIS_CLIENT')
      .useValue(redisMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    process.env.JWT_ACCESS_SECRET = 'test-secret-integration';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redisMock.get.mockResolvedValue('0');
    redisMock.incr.mockResolvedValue(1);
  });

  // ── Login ──────────────────────────────────────────────────────────────────

  it('integration.auth.login.successReturnsJWTAndCookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@modula.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('integration.auth.login.invalidCredentialsReturns401', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@modula.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('integration.auth.login.deactivatedAdminReturns403', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'deactivated@modula.com', password: 'Password123!' });

    expect(res.status).toBe(403);
  });

  it('integration.auth.login.rateLimitBlocksAfter5Attempts', async () => {
    redisMock.get.mockResolvedValue('5');

    const res = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@modula.com', password: 'wrongpassword' });

    expect(res.status).toBe(429);
  });

  // ── Guard ──────────────────────────────────────────────────────────────────

  it('integration.auth.guard.blocksRequestWithoutJWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/users')
      .send({ email: 'new@admin.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });

  it('integration.auth.guard.allowsRequestWithValidJWT', async () => {
    // Login first to get a token
    const loginRes = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@modula.com', password: 'Password123!' });

    const { accessToken } = loginRes.body;

    const res = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'new@admin.com', password: 'NewPassword123!' });

    expect(res.status).toBe(201);
  });
});
