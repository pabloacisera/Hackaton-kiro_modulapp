import { Injectable } from '@nestjs/common';

/**
 * TASK-stock-3: Excel parser with row-by-row validation.
 *
 * Expected columns: sku | name | unit | current_qty | min_stock | unit_cost_usd | supplier
 * Does NOT use a real xlsx library — parses a simplified CSV/JSON representation.
 * In production, replace with `xlsx` or `exceljs` package.
 */

export interface ExcelRow {
  sku: string;
  name: string;
  unit: string;
  currentQty: number;
  minStock: number;
  unitCostUsd: number;
  supplier: string | null;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  valid: ExcelRow[];
  errors: ParseError[];
}

const REQUIRED_HEADERS = [
  'sku',
  'name',
  'unit',
  'current_qty',
  'min_stock',
  'unit_cost_usd',
  'supplier',
];

@Injectable()
export class ExcelParserService {
  /**
   * Parse Excel-like data (rows as array of objects with header keys).
   * In production: parse xlsx buffer using exceljs. For now, accepts parsed JSON rows.
   */
  parse(rows: Record<string, unknown>[], headers?: string[]): ParseResult {
    const valid: ExcelRow[] = [];
    const errors: ParseError[] = [];

    // Validate headers if provided
    if (headers) {
      const normalized = headers.map((h) => h.toLowerCase().trim());
      const missing = REQUIRED_HEADERS.filter((h) => h !== 'supplier' && !normalized.includes(h));
      if (missing.length > 0) {
        errors.push({
          row: 0,
          field: 'headers',
          message: `Missing required columns: ${missing.join(', ')}`,
        });
        return { valid, errors };
      }
    }

    const seenSkus = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

      // Validate SKU
      const sku = String(row.sku ?? '')
        .trim()
        .toUpperCase();
      if (!sku) {
        errors.push({ row: rowNum, field: 'sku', message: 'SKU is required' });
        continue;
      }
      if (seenSkus.has(sku)) {
        errors.push({ row: rowNum, field: 'sku', message: `Duplicate SKU '${sku}' in file` });
        continue;
      }
      seenSkus.add(sku);

      // Validate name
      const name = String(row.name ?? '').trim();
      if (!name) {
        errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
        continue;
      }

      // Validate unit
      const unit = String(row.unit ?? '').trim();
      if (!unit) {
        errors.push({ row: rowNum, field: 'unit', message: 'Unit is required' });
        continue;
      }

      // Validate current_qty
      const currentQty = Number(row.current_qty ?? row.currentQty);
      if (isNaN(currentQty)) {
        errors.push({ row: rowNum, field: 'current_qty', message: 'current_qty must be a number' });
        continue;
      }
      if (currentQty < 0) {
        errors.push({
          row: rowNum,
          field: 'current_qty',
          message: 'current_qty cannot be negative',
        });
        continue;
      }

      // Validate min_stock
      const minStock = Number(row.min_stock ?? row.minStock);
      if (isNaN(minStock) || minStock < 0) {
        errors.push({
          row: rowNum,
          field: 'min_stock',
          message: 'min_stock must be a non-negative number',
        });
        continue;
      }

      // Validate unit_cost_usd
      const unitCostUsd = Number(row.unit_cost_usd ?? row.unitCostUsd);
      if (isNaN(unitCostUsd) || unitCostUsd < 0) {
        errors.push({
          row: rowNum,
          field: 'unit_cost_usd',
          message: 'unit_cost_usd must be a non-negative number',
        });
        continue;
      }

      const supplier = row.supplier ? String(row.supplier).trim() : null;

      valid.push({ sku, name, unit, currentQty, minStock, unitCostUsd, supplier });
    }

    return { valid, errors };
  }
}
