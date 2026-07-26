import { Injectable } from '@nestjs/common';

export interface CatalogExcelRow {
  name: string;
  description: string;
  category: 'modular_furniture' | 'arches';
  priceUsd: number;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays: number | null;
  active: boolean;
}

export interface CatalogParseError {
  row: number;
  field: string;
  message: string;
}

export interface CatalogParseResult {
  valid: CatalogExcelRow[];
  errors: CatalogParseError[];
}

const VALID_CATEGORIES = ['modular_furniture', 'arches'];

/**
 * Parses rows from an Excel/CSV/JSON file for catalog prototypes.
 * Expected columns: name, description, category, price_usd, stock_qty,
 * build_on_demand, estimated_delivery_days, active
 */
@Injectable()
export class CatalogExcelParserService {
  parse(rows: Record<string, unknown>[]): CatalogParseResult {
    const valid: CatalogExcelRow[] = [];
    const errors: CatalogParseError[] = [];

    const seenNames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2: row 1 is header, data starts at row 2

      // Validate name
      const name = String(row.name ?? '').trim();
      if (!name || name.length < 2) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: 'El nombre es obligatorio (mínimo 2 caracteres)',
        });
        continue;
      }
      if (seenNames.has(name.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: `Nombre duplicado en el archivo: "${name}"`,
        });
        continue;
      }
      seenNames.add(name.toLowerCase());

      // Validate description
      const description = String(row.description ?? row.descripcion ?? '').trim();
      if (!description || description.length < 10) {
        errors.push({
          row: rowNum,
          field: 'description',
          message: 'La descripción es obligatoria (mínimo 10 caracteres)',
        });
        continue;
      }

      // Validate category
      const categoryRaw = String(row.category ?? row.categoria ?? '')
        .trim()
        .toLowerCase();
      if (!VALID_CATEGORIES.includes(categoryRaw)) {
        errors.push({
          row: rowNum,
          field: 'category',
          message: `Categoría inválida: "${categoryRaw}". Valores permitidos: ${VALID_CATEGORIES.join(', ')}`,
        });
        continue;
      }
      const category = categoryRaw as 'modular_furniture' | 'arches';

      // Validate price
      const priceUsd = Number(row.price_usd ?? row.priceUsd ?? row.precio);
      if (isNaN(priceUsd) || priceUsd <= 0) {
        errors.push({
          row: rowNum,
          field: 'price_usd',
          message: 'El precio debe ser un número mayor a 0',
        });
        continue;
      }

      // Validate stock
      const stockQty = Number(row.stock_qty ?? row.stockQty ?? row.stock ?? 0);
      if (isNaN(stockQty) || stockQty < 0) {
        errors.push({
          row: rowNum,
          field: 'stock_qty',
          message: 'El stock debe ser un número no negativo',
        });
        continue;
      }

      // Parse build_on_demand
      const bodRaw = row.build_on_demand ?? row.buildOnDemand ?? row.bajo_pedido ?? false;
      const buildOnDemand =
        bodRaw === true ||
        bodRaw === 'true' ||
        bodRaw === '1' ||
        bodRaw === 'si' ||
        bodRaw === 'sí';

      // Parse estimated_delivery_days
      const eddRaw =
        row.estimated_delivery_days ?? row.estimatedDeliveryDays ?? row.dias_entrega ?? null;
      let estimatedDeliveryDays: number | null = null;
      if (eddRaw !== null && eddRaw !== '' && eddRaw !== undefined) {
        const edd = Number(eddRaw);
        if (!isNaN(edd) && edd > 0) {
          estimatedDeliveryDays = edd;
        }
      }

      // Parse active (default true)
      const activeRaw = row.active ?? row.activo ?? true;
      const active =
        activeRaw === true ||
        activeRaw === 'true' ||
        activeRaw === '1' ||
        activeRaw === 'si' ||
        activeRaw === 'sí';

      valid.push({
        name,
        description,
        category,
        priceUsd,
        stockQty,
        buildOnDemand,
        estimatedDeliveryDays,
        active,
      });
    }

    return { valid, errors };
  }
}
