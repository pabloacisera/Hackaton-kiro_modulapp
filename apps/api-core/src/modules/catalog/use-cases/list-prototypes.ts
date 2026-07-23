import { Inject, Injectable } from '@nestjs/common';
import {
  IPrototypeRepository,
  ListPrototypesFilter,
  PaginatedPrototypes,
  PROTOTYPE_REPOSITORY,
} from '../repositories/prototype.repository.port';

/**
 * TASK-catalog-2: List active prototypes with optional filters.
 */
@Injectable()
export class ListPrototypesUseCase {
  constructor(
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly repo: IPrototypeRepository,
  ) {}

  async execute(filter: ListPrototypesFilter): Promise<PaginatedPrototypes> {
    return this.repo.findAll({
      ...filter,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 12,
    });
  }
}
