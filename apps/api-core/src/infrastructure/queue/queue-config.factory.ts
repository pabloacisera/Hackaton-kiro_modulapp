import { BullModuleOptions } from '@nestjs/bull';

/**
 * TASK-queue-1: Environment-aware Redis connection factory.
 *
 * - Production (Upstash): uses UPSTASH_REDIS_URL with TLS
 * - Local dev: uses REDIS_HOST:REDIS_PORT (defaults to localhost:6379)
 */
export function createBullConfig(): BullModuleOptions {
  const upstashUrl = process.env.UPSTASH_REDIS_URL;

  if (upstashUrl) {
    // Production: Upstash Redis (TLS)
    const url = new URL(upstashUrl);
    return {
      redis: {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: upstashUrl.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: null,
      },
    };
  }

  // Local development: docker-compose Redis
  return {
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      maxRetriesPerRequest: null,
    },
  };
}
