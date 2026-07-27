import { BullModuleOptions } from '@nestjs/bull';

/**
 * TASK-queue-1: Environment-aware Redis connection factory for BullMQ.
 *
 * BullMQ requires persistent TCP connections — Upstash REST is NOT compatible.
 * Use a local Redis instance for queues (Docker or native).
 *
 * Priority:
 * 1. BULL_REDIS_URL — explicit TCP URL for queues (e.g. redis://localhost:6379)
 * 2. REDIS_HOST:REDIS_PORT — defaults to localhost:6379
 *
 * NOTE: Upstash REST (UPSTASH_REDIS_REST_URL) is used separately for
 * cache/rate-limiting via RedisModule — NOT for BullMQ queues.
 */
export function createBullConfig(): BullModuleOptions {
  const bullRedisUrl = process.env.BULL_REDIS_URL;

  if (bullRedisUrl) {
    const url = new URL(bullRedisUrl);
    return {
      redis: {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: bullRedisUrl.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    };
  }

  // Local Redis — localhost by default, REDIS_HOST for Docker Compose
  return {
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    },
  };
}
