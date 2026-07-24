import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';
import { AdminCatalogController } from './controllers/admin-catalog.controller';
import { ListPrototypesUseCase } from './use-cases/list-prototypes';
import { GetPrototypeUseCase } from './use-cases/get-prototype';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogEventPublisher } from './events/catalog-event.publisher';
import { PROTOTYPE_REPOSITORY } from './repositories/prototype.repository.port';
import { PrismaPrototypeRepository } from '../../infrastructure/prisma/repositories/prisma-prototype.repository';
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [CatalogController, AdminCatalogController],
  providers: [
    { provide: PROTOTYPE_REPOSITORY, useClass: PrismaPrototypeRepository },
    {
      provide: 'REDIS_CLIENT',
      useValue: {
        get: async () => null,
        set: async () => null,
        keys: async () => [],
        del: async () => null,
      },
    },
    ListPrototypesUseCase,
    GetPrototypeUseCase,
    CatalogCacheService,
    CatalogEventPublisher,
    JwtService,
    Reflector,
  ],
  exports: [
    CatalogEventPublisher,
    ListPrototypesUseCase,
    GetPrototypeUseCase,
    PROTOTYPE_REPOSITORY,
  ],
})
export class CatalogModule {}
