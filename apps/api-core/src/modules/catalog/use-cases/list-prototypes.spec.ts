import { NotFoundException } from '@nestjs/common';
import { ListPrototypesUseCase } from './list-prototypes';
import { GetPrototypeUseCase } from './get-prototype';
import { IPrototypeRepository } from '../repositories/prototype.repository.port';
import { Prototype } from '../domain/prototype.entity';

function makeProto(overrides = {}): Prototype {
  return new Prototype({
    id: 'p-1',
    name: 'Arch',
    description: 'desc',
    category: 'arches',
    priceUsd: 100,
    active: true,
    stockQty: 10,
    buildOnDemand: false,
    estimatedDeliveryDays: 7,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('ListPrototypesUseCase', () => {
  let repo: jest.Mocked<IPrototypeRepository>;
  let useCase: ListPrototypesUseCase;

  beforeEach(() => {
    repo = { findAll: jest.fn(), findAllAdmin: jest.fn(), findById: jest.fn(), save: jest.fn() };
    useCase = new ListPrototypesUseCase(repo as any);
  });

  it('returns paginated results from repository', async () => {
    const page = { items: [makeProto()], total: 1, page: 1, pageSize: 12 };
    repo.findAll.mockResolvedValue(page);
    const result = await useCase.execute({});
    expect(result.items).toHaveLength(1);
    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
  });

  it('passes category filter through to repository', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    await useCase.execute({ category: 'arches' });
    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ category: 'arches' }));
  });

  it('passes price range filter through', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    await useCase.execute({ minPrice: 50, maxPrice: 200 });
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 50, maxPrice: 200 }),
    );
  });

  it('passes search query through', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    await useCase.execute({ q: 'wooden' });
    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'wooden' }));
  });

  it('passes combined filters through', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    await useCase.execute({ category: 'arches', q: 'white', minPrice: 100 });
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'arches', q: 'white', minPrice: 100 }),
    );
  });

  it('uses default pagination when not provided', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    await useCase.execute({});
    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 12 }));
  });
});

describe('GetPrototypeUseCase', () => {
  let repo: jest.Mocked<IPrototypeRepository>;
  let useCase: GetPrototypeUseCase;

  beforeEach(() => {
    repo = { findAll: jest.fn(), findAllAdmin: jest.fn(), findById: jest.fn(), save: jest.fn() };
    useCase = new GetPrototypeUseCase(repo as any);
  });

  it('returns prototype for valid id', async () => {
    const proto = makeProto();
    repo.findById.mockResolvedValue(proto);
    const result = await useCase.execute('p-1');
    expect(result).toBe(proto);
  });

  it('throws NotFoundException for invalid id', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('nonexistent')).rejects.toThrow(NotFoundException);
  });
});
