import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { ListPrototypesUseCase } from '../use-cases/list-prototypes';
import { GetPrototypeUseCase } from '../use-cases/get-prototype';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import { CatalogEventPublisher } from '../events/catalog-event.publisher';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly listPrototypes: ListPrototypesUseCase,
    private readonly getPrototype: GetPrototypeUseCase,
    private readonly cache: CatalogCacheService,
    private readonly events: CatalogEventPublisher,
  ) {}

  // ── TASK-catalog-2: List prototypes ──────────────────────────────────────

  @Get('prototypes')
  async list(
    @Query('category') category?: 'modular_furniture' | 'arches',
    @Query('q') q?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filter = {
      category,
      q,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 12,
    };

    const cacheKey = this.cache.buildListingKey(filter);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.listPrototypes.execute(filter);
    await this.cache.set(cacheKey, result);
    return result;
  }

  @Get('prototypes/:id')
  async detail(@Param('id') id: string) {
    return this.getPrototype.execute(id);
  }

  // ── TASK-catalog-4: SSE stream ────────────────────────────────────────────

  @Get('stream')
  sse(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sub = this.events.events$.subscribe((event) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    });

    res.on('close', () => sub.unsubscribe());
  }
}
