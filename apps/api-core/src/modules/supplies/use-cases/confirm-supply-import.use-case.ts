import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupplyCrudUseCase } from './supply-crud.use-case';
import { ImportSupplyExcelUseCase } from './import-supply-excel.use-case';
import { ISupplyRepository, SUPPLY_REPOSITORY } from '../repositories/supply.repository.port';

export interface ConfirmResult {
  applied: number;
  errors: { sku: string; message: string }[];
}

/**
 * TASK-stock-5: Confirm Excel import — applies valid changes from preview.
 * Uses SupplyCrudUseCase underneath (consistency rule).
 * Preview data retrieved from Upstash Redis.
 */
@Injectable()
export class ConfirmSupplyImportUseCase {
  private readonly logger = new Logger(ConfirmSupplyImportUseCase.name);

  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly repo: ISupplyRepository,
    private readonly crud: SupplyCrudUseCase,
    private readonly importUseCase: ImportSupplyExcelUseCase,
  ) {}

  async execute(previewId: string, actor: string): Promise<ConfirmResult> {
    const rows = await this.importUseCase.getPreviewData(previewId);
    if (!rows) {
      throw new Error('Invalid or expired preview ID');
    }

    let applied = 0;
    const errors: { sku: string; message: string }[] = [];

    for (const row of rows) {
      try {
        const existing = await this.repo.findBySku(row.sku);
        if (!existing) {
          await this.crud.create(
            {
              sku: row.sku,
              name: row.name,
              unit: row.unit,
              currentQty: row.currentQty,
              minStock: row.minStock,
              unitCostUsd: row.unitCostUsd,
              supplier: row.supplier,
            },
            actor,
          );
        } else {
          await this.crud.update(
            existing.id,
            {
              name: row.name,
              unit: row.unit,
              currentQty: row.currentQty,
              minStock: row.minStock,
              unitCostUsd: row.unitCostUsd,
              supplier: row.supplier,
            },
            actor,
            'excel_import',
          );
        }
        applied++;
      } catch (err) {
        errors.push({ sku: row.sku, message: (err as Error).message });
      }
    }

    await this.importUseCase.clearPreview(previewId);
    this.logger.log(`Import confirmed: ${applied} applied, ${errors.length} errors`);
    return { applied, errors };
  }
}
