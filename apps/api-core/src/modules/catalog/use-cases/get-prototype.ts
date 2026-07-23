import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prototype } from '../domain/prototype.entity';
import { IPrototypeRepository, PROTOTYPE_REPOSITORY } from '../repositories/prototype.repository.port';

@Injectable()
export class GetPrototypeUseCase {
  constructor(
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly repo: IPrototypeRepository,
  ) {}

  async execute(id: string): Promise<Prototype> {
    const prototype = await this.repo.findById(id);
    if (!prototype) {
      throw new NotFoundException(`Prototype ${id} not found`);
    }
    return prototype;
  }
}
