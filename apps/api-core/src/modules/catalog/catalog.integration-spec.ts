import { Test, TestingModule } from '@nestjs/testing';
import { ListPrototypesUseCase } from './use-cases/list-prototypes';
import { GetPrototypeUseCase } from './use-cases/get-prototype';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogEventPublisher } from './events/catalog-event.publisher';
import { PROTOTYPE_REPOSITORY } from './repositories/prototype.repository.port';
import { InMemoryPrototypeRepository } from './repositories/in-memory-prototype.repository';
import { Prototype } from './domain/prototype.entity';

describe('Catalog Module — Integration Tests', () => {
  let listPrototypes: ListPrototypesUseCase;
  let getPrototype: GetPrototypeUseCase;
  let repo: InMemoryPrototypeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
    }).compile();

    listPrototypes = module.get(ListPrototypesUseCase);
    getPrototype = module.get(GetPrototypeUseCase);
    repo = module.get(PROTOTYPE_REPOSITORY);
  });

  function createProto(
    overrides: Partial<{
      id: string;
      name: string;
      category: 'modular_furniture' | 'arches';
      priceUsd: number;
      active: boolean;
      stockQty: number;
    }> = {},
  ): Prototype {
    return new Prototype({
      id: overrides.id ?? crypto.randomUUID(),
      name: overrides.name ?? 'Test Shelf',
      description: 'A test prototype',
      category: overrides.category ?? 'modular_furniture',
      priceUsd: overrides.priceUsd ?? 99.99,
      active: overrides.active ?? true,
      stockQty: overrides.stockQty ?? 10,
      buildOnDemand: false,
      estimatedDeliveryDays: 7,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  describe('List prototypes', () => {
    it('returns paginated results', async () => {
      await repo.save(createProto({ name: 'Shelf A' }));
      await repo.save(createProto({ name: 'Shelf B' }));
      await repo.save(createProto({ name: 'Arch C', category: 'arches' }));

      const result = await listPrototypes.execute({});
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
    });

    it('filters by category', async () => {
      await repo.save(createProto({ name: 'Furniture', category: 'modular_furniture' }));
      await repo.save(createProto({ name: 'Arch', category: 'arches' }));

      const result = await listPrototypes.execute({ category: 'arches' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Arch');
    });

    it('filters by search query', async () => {
      await repo.save(createProto({ name: 'MDF Bookshelf' }));
      await repo.save(createProto({ name: 'Wedding Arch' }));

      const result = await listPrototypes.execute({ q: 'wedding' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Wedding Arch');
    });

    it('excludes inactive prototypes', async () => {
      await repo.save(createProto({ name: 'Active', active: true }));
      await repo.save(createProto({ name: 'Inactive', active: false }));

      const result = await listPrototypes.execute({});
      expect(result.items.every((p: Prototype) => p.active)).toBe(true);
    });
  });

  describe('Get prototype by ID', () => {
    it('returns prototype when found', async () => {
      const proto = createProto({ id: 'proto-test-1', name: 'Specific' });
      await repo.save(proto);

      const found = await getPrototype.execute('proto-test-1');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Specific');
    });

    it('throws when not found', async () => {
      await expect(getPrototype.execute('non-existent')).rejects.toThrow('not found');
    });
  });
});
