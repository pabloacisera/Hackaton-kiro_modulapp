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

@Module({
  imports: [NotificationsModule],
  controllers: [SuppliesController],
  providers: [
    supplyRepoProvider,
    SupplyCrudUseCase,
    ImportSupplyExcelUseCase,
    ConfirmSupplyImportUseCase,
    ExcelParserService,
    LowStockCheckJob,
  ],
  exports: [SUPPLY_REPOSITORY, SupplyCrudUseCase],
})
export class SuppliesModule {}
