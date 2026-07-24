import { Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { SUPPLY_REPOSITORY } from './repositories/supply.repository.port';
import { PrismaSupplyRepository } from '../../infrastructure/prisma/repositories/prisma-supply.repository';
import { SuppliesController } from './controllers/supplies.controller';
import { SupplyCrudUseCase } from './use-cases/supply-crud.use-case';
import { ImportSupplyExcelUseCase } from './use-cases/import-supply-excel.use-case';
import { ConfirmSupplyImportUseCase } from './use-cases/confirm-supply-import.use-case';
import { ExcelParserService } from './services/excel-parser.service';
import { LowStockCheckJob } from './jobs/low-stock-check.job';

const supplyRepoProvider = {
  provide: SUPPLY_REPOSITORY,
  useClass: PrismaSupplyRepository,
};

/**
 * Upstash Redis client provider.
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env.
 * Falls back to an in-memory stub for tests when env vars are not set.
 */
const redisClientProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      // Production/dev: use real Upstash Redis REST client
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
          const result = await redis.keys(pattern);
          return result;
        },
      };
    }

    // Test fallback: in-memory stub (only when Upstash credentials are missing)
    const store = new Map<string, { value: string; expiresAt: number | null }>();
    return {
      get: async (key: string): Promise<string | null> => {
        const entry = store.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          store.delete(key);
          return null;
        }
        return entry.value;
      },
      set: async (key: string, value: string, ...args: unknown[]): Promise<void> => {
        let expiresAt: number | null = null;
        if (args[0] === 'EX' && typeof args[1] === 'number') {
          expiresAt = Date.now() + args[1] * 1000;
        }
        store.set(key, { value, expiresAt });
      },
      del: async (key: string): Promise<void> => {
        store.delete(key);
      },
      keys: async (pattern: string): Promise<string[]> => {
        const prefix = pattern.replace('*', '');
        return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
      },
    };
  },
};

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [SuppliesController],
  providers: [
    supplyRepoProvider,
    redisClientProvider,
    SupplyCrudUseCase,
    ImportSupplyExcelUseCase,
    ConfirmSupplyImportUseCase,
    ExcelParserService,
    LowStockCheckJob,
  ],
  exports: [SUPPLY_REPOSITORY, SupplyCrudUseCase, LowStockCheckJob],
})
export class SuppliesModule {}
