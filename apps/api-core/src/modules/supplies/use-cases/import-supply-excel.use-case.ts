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

// In-memory store for previews (replace with Redis/cache in production)
const previewStore = new Map<string, ExcelRow[]>();

/**
 * TASK-stock-4: Import Excel preview — parses, classifies, returns diff without persisting.
 */
@Injectable()
export class ImportSupplyExcelUseCase {
  private readonly logger = new Logger(ImportSupplyExcelUseCase.name);

  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly repo: ISupplyRepository,
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
    previewStore.set(previewId, valid);

    this.logger.log(
      `Import preview ${previewId}: ${toCreate.length} to create, ${toUpdate.length} to update, ${errors.length} errors`,
    );
    return { previewId, toCreate, toUpdate, errors };
  }

  /** Retrieve stored preview data for confirmation */
  getPreviewData(previewId: string): ExcelRow[] | null {
    return previewStore.get(previewId) ?? null;
  }

  /** Remove preview after use */
  clearPreview(previewId: string): void {
    previewStore.delete(previewId);
  }
}
