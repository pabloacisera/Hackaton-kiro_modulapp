import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';
import { ListPrototypesUseCase } from './use-cases/list-prototypes';
import { GetPrototypeUseCase } from './use-cases/get-prototype';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogEventPublisher } from './events/catalog-event.publisher';
import { PROTOTYPE_REPOSITORY } from './repositories/prototype.repository.port';
import { InMemoryPrototypeRepository } from './repositories/in-memory-prototype.repository';

@Module({
  controllers: [CatalogController],
  providers: [
    { provide: PROTOTYPE_REPOSITORY, useClass: InMemoryPrototypeRepository },
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
  ],
  exports: [CatalogEventPublisher, ListPrototypesUseCase, GetPrototypeUseCase],
})
export class CatalogModule {}
