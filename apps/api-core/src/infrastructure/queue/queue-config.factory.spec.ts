import { createBullConfig } from './queue-config.factory';

describe('queue-config.factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns TLS config when BULL_REDIS_URL uses rediss://', () => {
    process.env.BULL_REDIS_URL = 'rediss://:password123@my-redis.upstash.io:6379';

    const config = createBullConfig();

    expect(config.redis).toMatchObject({
      host: 'my-redis.upstash.io',
      port: 6379,
      password: 'password123',
      maxRetriesPerRequest: null,
    });
    expect((config.redis as any).tls).toEqual({});
  });

  it('returns config without TLS when BULL_REDIS_URL uses redis://', () => {
    process.env.BULL_REDIS_URL = 'redis://:pass@host.upstash.io:6380';

    const config = createBullConfig();

    expect(config.redis).toMatchObject({
      host: 'host.upstash.io',
      port: 6380,
      password: 'pass',
      maxRetriesPerRequest: null,
    });
    expect((config.redis as any).tls).toBeUndefined();
  });

  it('returns localhost config when BULL_REDIS_URL is not set', () => {
    delete process.env.BULL_REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    const config = createBullConfig();

    expect(config.redis).toMatchObject({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });
  });

  it('uses REDIS_HOST and REDIS_PORT when BULL_REDIS_URL is not set', () => {
    delete process.env.BULL_REDIS_URL;
    process.env.REDIS_HOST = 'redis-container';
    process.env.REDIS_PORT = '6380';

    const config = createBullConfig();

    expect(config.redis).toMatchObject({
      host: 'redis-container',
      port: 6380,
      maxRetriesPerRequest: null,
    });
  });
});
