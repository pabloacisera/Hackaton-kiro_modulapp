import { Injectable, Inject, Logger } from '@nestjs/common';
import { ExcelParserService, ExcelRow, ParseError } from '../services/excel-parser.service';
import { ISupplyRepository, SUPPLY_REPOSITORY } from '../repositories/supply.repository.port';

export interface ImportPreviewItem {
  sku: string;
  name: string;
  action: 'create' | 'update';
  changes?: Record<string, { from: unknown; to: unknown }>;
}

export interface ImportPreviewResult {
  previewId: string;
  toCreate: ImportPreviewItem[];
  toUpdate: ImportPreviewItem[];
  errors: ParseError[];
}

const PREVIEW_TTL_SECONDS = 600; // 10 minutes

/**
 * TASK-stock-4: Import Excel preview — parses, classifies, returns diff without persisting.
 * Uses Upstash Redis for preview storage with TTL.
 */
@Injectable()
export class ImportSupplyExcelUseCase {
  private readonly logger = new Logger(ImportSupplyExcelUseCase.name);

  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly repo: ISupplyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, ...args: unknown[]) => Promise<unknown>;
      del: (key: string) => Promise<unknown>;
    },
    private readonly parser: ExcelParserService,
  ) {}

  async preview(rows: Record<string, unknown>[]): Promise<ImportPreviewResult> {
    const { valid, errors } = this.parser.parse(rows);

    if (valid.length === 0 && errors.length > 0) {
      return { previewId: '', toCreate: [], toUpdate: [], errors };
    }

    const toCreate: ImportPreviewItem[] = [];
    const toUpdate: ImportPreviewItem[] = [];

    for (const row of valid) {
      const existing = await this.repo.findBySku(row.sku);
      if (!existing) {
        toCreate.push({ sku: row.sku, name: row.name, action: 'create' });
      } else {
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        if (existing.name !== row.name) changes.name = { from: existing.name, to: row.name };
        if (existing.currentQty !== row.currentQty)
          changes.currentQty = { from: existing.currentQty, to: row.currentQty };
        if (existing.minStock !== row.minStock)
          changes.minStock = { from: existing.minStock, to: row.minStock };
        if (existing.unitCostUsd !== row.unitCostUsd)
          changes.unitCostUsd = { from: existing.unitCostUsd, to: row.unitCostUsd };
        if (existing.supplier !== row.supplier)
          changes.supplier = { from: existing.supplier, to: row.supplier };

        if (Object.keys(changes).length > 0) {
          toUpdate.push({ sku: row.sku, name: row.name, action: 'update', changes });
        }
      }
    }

    const previewId = crypto.randomUUID();
    const redisKey = `supply:import-preview:${previewId}`;
    await this.redis.set(redisKey, JSON.stringify(valid), 'EX', PREVIEW_TTL_SECONDS);

    this.logger.log(
      `Import preview ${previewId}: ${toCreate.length} to create, ${toUpdate.length} to update, ${errors.length} errors`,
    );
    return { previewId, toCreate, toUpdate, errors };
  }

  /** Retrieve stored preview data for confirmation */
  async getPreviewData(previewId: string): Promise<ExcelRow[] | null> {
    const redisKey = `supply:import-preview:${previewId}`;
    const raw = await this.redis.get(redisKey);
    if (!raw) return null;
    return JSON.parse(raw) as ExcelRow[];
  }

  /** Remove preview after use */
  async clearPreview(previewId: string): Promise<void> {
    const redisKey = `supply:import-preview:${previewId}`;
    await this.redis.del(redisKey);
  }
}
