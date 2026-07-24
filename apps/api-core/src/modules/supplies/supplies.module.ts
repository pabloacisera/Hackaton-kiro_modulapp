import { Module } from '@nestjs/common';
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

/**
 * Issue #15: Removed local REDIS_CLIENT + in-memory Map fallback.
 * Now uses shared RedisModule (global) — real Upstash Redis for all environments.
 */
@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [SuppliesController],
  providers: [
    { provide: SUPPLY_REPOSITORY, useClass: PrismaSupplyRepository },
    SupplyCrudUseCase,
    ImportSupplyExcelUseCase,
    ConfirmSupplyImportUseCase,
    ExcelParserService,
    LowStockCheckJob,
  ],
  exports: [SUPPLY_REPOSITORY, SupplyCrudUseCase, LowStockCheckJob],
})
export class SuppliesModule {}
