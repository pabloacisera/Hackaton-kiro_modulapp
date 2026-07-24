import { Module, Global, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

/**
 * Issue #15 — Shared Redis module.
 *
 * Provides a real Upstash Redis client to all modules that need REDIS_CLIENT.
 * Replaces the no-op stubs in CatalogModule, AuthModule, and SuppliesModule.
 *
 * - Production/dev: Uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * - If credentials missing: logs warning and provides a degraded (but functional) client
 *   that returns null/0 for reads (cache miss behavior) — never silently pretends to work.
 */
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const logger = new Logger('RedisModule');
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (url && token) {
          logger.log('Redis connected (Upstash REST)');
          const redis = new Redis({ url, token });

          return {
            get: async (key: string): Promise<string | null> => {
              const value = await redis.get<string>(key);
              return value ?? null;
            },
            set: async (key: string, value: string, ...args: unknown[]): Promise<void> => {
              if (args[0] === 'EX' && typeof args[1] === 'number') {
                await redis.set(key, value, { ex: args[1] as number });
              } else {
                await redis.set(key, value);
              }
            },
            del: async (key: string): Promise<void> => {
              await redis.del(key);
            },
            keys: async (pattern: string): Promise<string[]> => {
              return await redis.keys(pattern);
            },
            incr: async (key: string): Promise<number> => {
              return await redis.incr(key);
            },
            expire: async (key: string, seconds: number): Promise<void> => {
              await redis.expire(key, seconds);
            },
          };
        }

        // No credentials: warn and provide cache-miss behavior
        // This is NOT a silent mock — it logs clearly and behaves as "empty cache"
        logger.warn(
          'UPSTASH_REDIS_REST_URL/TOKEN not set — Redis operating in pass-through mode ' +
            '(cache misses, rate limiting disabled). Set credentials in .env for full functionality.',
        );

        return {
          get: async (): Promise<string | null> => null,
          set: async (): Promise<void> => {},
          del: async (): Promise<void> => {},
          keys: async (): Promise<string[]> => [],
          incr: async (key: string): Promise<number> => {
            logger.warn(`Rate limit increment on "${key}" — Redis not configured`);
            return 999; // Return high number to BLOCK by default (fail-secure)
          },
          expire: async (): Promise<void> => {},
        };
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
