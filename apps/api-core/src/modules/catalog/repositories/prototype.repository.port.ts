import { Prototype } from '../domain/prototype.entity';

export interface ListPrototypesFilter {
  category?: 'modular_furniture' | 'arches';
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface AdminListPrototypesFilter {
  category?: 'modular_furniture' | 'arches';
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPrototypes {
  items: Prototype[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPrototypeRepository {
  findAll(filter: ListPrototypesFilter): Promise<PaginatedPrototypes>;
  findAllAdmin(filter: AdminListPrototypesFilter): Promise<PaginatedPrototypes>;
  findById(id: string): Promise<Prototype | null>;
  save(prototype: Prototype): Promise<Prototype>;
}

export const PROTOTYPE_REPOSITORY = Symbol('IPrototypeRepository');
