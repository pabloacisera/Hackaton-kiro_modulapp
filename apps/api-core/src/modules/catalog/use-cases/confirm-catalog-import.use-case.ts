import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PROTOTYPE_REPOSITORY,
  IPrototypeRepository,
} from '../repositories/prototype.repository.port';
import { Prototype } from '../domain/prototype.entity';
import { ImportCatalogExcelUseCase } from './import-catalog-excel.use-case';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import { CatalogEventPublisher } from '../events/catalog-event.publisher';

export interface CatalogConfirmResult {
  applied: number;
  errors: { name: string; message: string }[];
}

@Injectable()
export class ConfirmCatalogImportUseCase {
  private readonly logger = new Logger(ConfirmCatalogImportUseCase.name);

  constructor(
    @Inject(PROTOTYPE_REPOSITORY) private readonly repo: IPrototypeRepository,
    private readonly importUseCase: ImportCatalogExcelUseCase,
    private readonly cache: CatalogCacheService,
    private readonly events: CatalogEventPublisher,
  ) {}

  async execute(previewId: string): Promise<CatalogConfirmResult> {
    const rows = await this.importUseCase.getPreviewData(previewId);
    if (!rows) {
      throw new Error('Preview expirado o inválido. Por favor, vuelve a subir el archivo.');
    }

    let applied = 0;
    const errors: { name: string; message: string }[] = [];

    // Fetch all existing prototypes to match by name
    const allPrototypes = await this.repo.findAllAdmin({ pageSize: 10000 });

    for (const row of rows) {
      try {
        const existing = allPrototypes.items.find(
          (p) => p.toProps().name.toLowerCase() === row.name.toLowerCase(),
        );

        if (!existing) {
          // Create new prototype
          const prototype = new Prototype({
            id: crypto.randomUUID(),
            name: row.name,
            description: row.description,
            category: row.category,
            priceUsd: row.priceUsd,
            active: row.active,
            stockQty: row.stockQty,
            buildOnDemand: row.buildOnDemand,
            estimatedDeliveryDays: row.estimatedDeliveryDays,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          const saved = await this.repo.save(prototype);
          const props = saved.toProps();
          this.events.publishUpdated(props.id, props.priceUsd, props.stockQty);
        } else {
          // Update existing prototype
          const props = existing.toProps();
          const updated = new Prototype({
            ...props,
            name: row.name,
            description: row.description,
            category: row.category,
            priceUsd: row.priceUsd,
            active: row.active,
            stockQty: row.stockQty,
            buildOnDemand: row.buildOnDemand,
            estimatedDeliveryDays: row.estimatedDeliveryDays,
            updatedAt: new Date(),
          });
          const saved = await this.repo.save(updated);
          const savedProps = saved.toProps();

          if (!row.active) {
            this.events.publishDeactivated(savedProps.id);
          } else {
            this.events.publishUpdated(savedProps.id, savedProps.priceUsd, savedProps.stockQty);
          }
        }
        applied++;
      } catch (err) {
        errors.push({ name: row.name, message: (err as Error).message });
      }
    }

    await this.importUseCase.clearPreview(previewId);
    await this.cache.invalidateListings();

    this.logger.log(`Catalog import confirmed: ${applied} applied, ${errors.length} errors`);
    return { applied, errors };
  }
}
