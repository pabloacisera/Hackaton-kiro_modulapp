import { Injectable } from '@nestjs/common';
import { Prototype } from '../domain/prototype.entity';
import {
  IPrototypeRepository,
  ListPrototypesFilter,
  PaginatedPrototypes,
} from './prototype.repository.port';

@Injectable()
export class InMemoryPrototypeRepository implements IPrototypeRepository {
  private readonly items = new Map<string, Prototype>();

  async findAll(filter: ListPrototypesFilter): Promise<PaginatedPrototypes> {
    let results = [...this.items.values()].filter((p) => p.active);

    if (filter.category) {
      results = results.filter((p) => p.category === filter.category);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (filter.minPrice !== undefined) {
      results = results.filter((p) => p.priceUsd >= filter.minPrice!);
    }
    if (filter.maxPrice !== undefined) {
      results = results.filter((p) => p.priceUsd <= filter.maxPrice!);
    }

    const total = results.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 12;
    const items = results.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<Prototype | null> {
    return this.items.get(id) ?? null;
  }

  async save(prototype: Prototype): Promise<Prototype> {
    this.items.set(prototype.id, prototype);
    return prototype;
  }
}
