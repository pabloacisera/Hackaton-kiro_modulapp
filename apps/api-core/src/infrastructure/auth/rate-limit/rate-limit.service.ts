import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  async increment(key: string, windowSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return count;
  }

  async getCount(key: string): Promise<number> {
    const val = await this.redis.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async isBlocked(key: string, maxAttempts: number): Promise<boolean> {
    const count = await this.getCount(key);
    return count >= maxAttempts;
  }
}
