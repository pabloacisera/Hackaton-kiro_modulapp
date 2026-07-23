import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SUPPLY_REPOSITORY } from './repositories/supply.repository.port';
import { InMemorySupplyRepository } from './repositories/in-memory-supply.repository';
import { SuppliesController } from './controllers/supplies.controller';
import { SupplyCrudUseCase } from './use-cases/supply-crud.use-case';
import { ImportSupplyExcelUseCase } from './use-cases/import-supply-excel.use-case';
import { ConfirmSupplyImportUseCase } from './use-cases/confirm-supply-import.use-case';
import { ExcelParserService } from './services/excel-parser.service';
import { LowStockCheckJob } from './jobs/low-stock-check.job';

const supplyRepoProvider = {
  provide: SUPPLY_REPOSITORY,
  useClass: InMemorySupplyRepository,
};

// Redis client stub — uses UPSTASH_REDIS_URL in production.
// Same pattern as auth.module.ts and catalog.module.ts.
const redisClientProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    // In-memory stub that mimics Redis get/set/del for dev/test.
    // In production, replace with Upstash Redis client:
    //   import { Redis } from '@upstash/redis'
    //   return new Redis({ url: process.env.UPSTASH_REDIS_URL })
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
        // Handle 'EX' ttl arg: set(key, value, 'EX', seconds)
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
  imports: [NotificationsModule],
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
  exports: [SUPPLY_REPOSITORY, SupplyCrudUseCase],
})
export class SuppliesModule {}
