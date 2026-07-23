import { Inject, Injectable, Logger } from '@nestjs/common';

const CACHE_TTL_SECONDS = 60;

/**
 * TASK-catalog-3: Redis cache for catalog listings.
 * Invalidated when an admin updates a prototype.
 */
@Injectable()
export class CatalogCacheService {
  private readonly logger = new Logger(CatalogCacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Cache set failed for key=${key}: ${err}`);
    }
  }

  async invalidateListings(): Promise<void> {
    try {
      // Delete all keys matching the catalog listing pattern
      const keys: string[] = await this.redis.keys('catalog:list:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Cache invalidation failed: ${err}`);
    }
  }

  buildListingKey(filter: Record<string, unknown>): string {
    return 'catalog:list:' + JSON.stringify(filter);
  }
}
