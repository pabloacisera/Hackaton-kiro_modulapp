import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PROTOTYPE_REPOSITORY,
  IPrototypeRepository,
} from '../repositories/prototype.repository.port';
import {
  CatalogExcelParserService,
  CatalogExcelRow,
} from '../services/catalog-excel-parser.service';

const PREVIEW_TTL_SECONDS = 600; // 10 minutes

export interface CatalogImportPreviewItem {
  name: string;
  category: string;
  action: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
}

export interface CatalogImportPreviewResult {
  previewId: string;
  toCreate: CatalogImportPreviewItem[];
  toUpdate: CatalogImportPreviewItem[];
  toDeactivate: CatalogImportPreviewItem[];
  errors: { row: number; field: string; message: string }[];
}

@Injectable()
export class ImportCatalogExcelUseCase {
  private readonly logger = new Logger(ImportCatalogExcelUseCase.name);

  constructor(
    @Inject(PROTOTYPE_REPOSITORY) private readonly repo: IPrototypeRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, ...args: unknown[]) => Promise<unknown>;
      del: (key: string) => Promise<unknown>;
    },
    private readonly parser: CatalogExcelParserService,
  ) {}

  async preview(rows: Record<string, unknown>[]): Promise<CatalogImportPreviewResult> {
    const { valid, errors } = this.parser.parse(rows);

    if (valid.length === 0 && errors.length > 0) {
      return { previewId: '', toCreate: [], toUpdate: [], toDeactivate: [], errors };
    }

    const toCreate: CatalogImportPreviewItem[] = [];
    const toUpdate: CatalogImportPreviewItem[] = [];
    const toDeactivate: CatalogImportPreviewItem[] = [];

    // Fetch all existing prototypes to match by name
    const allPrototypes = await this.repo.findAllAdmin({ pageSize: 10000 });

    for (const row of valid) {
      const existing = allPrototypes.items.find(
        (p) => p.toProps().name.toLowerCase() === row.name.toLowerCase(),
      );

      if (!existing) {
        toCreate.push({ name: row.name, category: row.category, action: 'create' });
      } else {
        const props = existing.toProps();
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        if (props.description !== row.description)
          changes.description = { from: props.description, to: row.description };
        if (props.category !== row.category)
          changes.category = { from: props.category, to: row.category };
        if (props.priceUsd !== row.priceUsd)
          changes.priceUsd = { from: props.priceUsd, to: row.priceUsd };
        if (props.stockQty !== row.stockQty)
          changes.stockQty = { from: props.stockQty, to: row.stockQty };
        if (props.buildOnDemand !== row.buildOnDemand)
          changes.buildOnDemand = { from: props.buildOnDemand, to: row.buildOnDemand };
        if (props.estimatedDeliveryDays !== row.estimatedDeliveryDays)
          changes.estimatedDeliveryDays = {
            from: props.estimatedDeliveryDays,
            to: row.estimatedDeliveryDays,
          };
        if (props.active !== row.active) {
          changes.active = { from: props.active, to: row.active };
          if (!row.active) {
            toDeactivate.push({ name: row.name, category: row.category, action: 'deactivate' });
            continue;
          }
        }

        if (Object.keys(changes).length > 0) {
          toUpdate.push({ name: row.name, category: row.category, action: 'update', changes });
        }
      }
    }

    const previewId = crypto.randomUUID();
    const redisKey = `catalog:import-preview:${previewId}`;
    await this.redis.set(redisKey, JSON.stringify(valid), 'EX', PREVIEW_TTL_SECONDS);

    this.logger.log(
      `Catalog import preview ${previewId}: ${toCreate.length} to create, ${toUpdate.length} to update, ${toDeactivate.length} to deactivate, ${errors.length} errors`,
    );

    return { previewId, toCreate, toUpdate, toDeactivate, errors };
  }

  async getPreviewData(previewId: string): Promise<CatalogExcelRow[] | null> {
    const redisKey = `catalog:import-preview:${previewId}`;
    const raw = await this.redis.get(redisKey);
    if (!raw) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as CatalogExcelRow[];
  }

  async clearPreview(previewId: string): Promise<void> {
    const redisKey = `catalog:import-preview:${previewId}`;
    await this.redis.del(redisKey);
  }
}
