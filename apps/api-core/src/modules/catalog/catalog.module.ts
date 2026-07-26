import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';
import { AdminCatalogController } from './controllers/admin-catalog.controller';
import { ListPrototypesUseCase } from './use-cases/list-prototypes';
import { GetPrototypeUseCase } from './use-cases/get-prototype';
import { ImportCatalogExcelUseCase } from './use-cases/import-catalog-excel.use-case';
import { ConfirmCatalogImportUseCase } from './use-cases/confirm-catalog-import.use-case';
import { CatalogExcelParserService } from './services/catalog-excel-parser.service';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogEventPublisher } from './events/catalog-event.publisher';
import { PROTOTYPE_REPOSITORY } from './repositories/prototype.repository.port';
import { PrismaPrototypeRepository } from '../../infrastructure/prisma/repositories/prisma-prototype.repository';
import { AuthModule } from '../auth/auth.module';

/**
 * Issue #15: Removed REDIS_CLIENT no-op stub — now uses shared RedisModule (global).
 * Issue #15: Removed manual JwtService/Reflector — now imports AuthModule properly.
 */
@Module({
  imports: [AuthModule],
  controllers: [CatalogController, AdminCatalogController],
  providers: [
    { provide: PROTOTYPE_REPOSITORY, useClass: PrismaPrototypeRepository },
    ListPrototypesUseCase,
    GetPrototypeUseCase,
    ImportCatalogExcelUseCase,
    ConfirmCatalogImportUseCase,
    CatalogExcelParserService,
    CatalogCacheService,
    CatalogEventPublisher,
  ],
  exports: [
    CatalogEventPublisher,
    ListPrototypesUseCase,
    GetPrototypeUseCase,
    PROTOTYPE_REPOSITORY,
  ],
})
export class CatalogModule {}
