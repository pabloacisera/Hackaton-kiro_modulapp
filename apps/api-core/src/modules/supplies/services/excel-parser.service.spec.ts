import { ExcelParserService } from './excel-parser.service';

describe('ExcelParserService', () => {
  let parser: ExcelParserService;

  beforeEach(() => {
    parser = new ExcelParserService();
  });

  it('parses valid rows correctly', () => {
    const rows = [
      {
        sku: 'MDF-001',
        name: 'MDF Board',
        unit: 'm2',
        current_qty: 50,
        min_stock: 10,
        unit_cost_usd: 12.5,
        supplier: 'Acme',
      },
      {
        sku: 'NAIL-100',
        name: 'Nails 2"',
        unit: 'kg',
        current_qty: 20,
        min_stock: 5,
        unit_cost_usd: 3,
        supplier: null,
      },
    ];
    const result = parser.parse(rows);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].sku).toBe('MDF-001');
  });

  it('reports duplicate SKU in file', () => {
    const rows = [
      {
        sku: 'MDF-001',
        name: 'Board A',
        unit: 'm2',
        current_qty: 10,
        min_stock: 5,
        unit_cost_usd: 10,
        supplier: null,
      },
      {
        sku: 'mdf-001',
        name: 'Board B',
        unit: 'm2',
        current_qty: 20,
        min_stock: 5,
        unit_cost_usd: 10,
        supplier: null,
      },
    ];
    const result = parser.parse(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Duplicate SKU');
  });

  it('reports negative current_qty', () => {
    const rows = [
      {
        sku: 'NEG-1',
        name: 'Item',
        unit: 'unit',
        current_qty: -5,
        min_stock: 2,
        unit_cost_usd: 1,
        supplier: null,
      },
    ];
    const result = parser.parse(rows);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('current_qty');
  });

  it('reports missing required fields', () => {
    const rows = [
      {
        sku: '',
        name: 'Item',
        unit: 'unit',
        current_qty: 10,
        min_stock: 2,
        unit_cost_usd: 1,
        supplier: null,
      },
      {
        sku: 'OK-1',
        name: '',
        unit: 'unit',
        current_qty: 10,
        min_stock: 2,
        unit_cost_usd: 1,
        supplier: null,
      },
    ];
    const result = parser.parse(rows);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].field).toBe('sku');
    expect(result.errors[1].field).toBe('name');
  });

  it('reports missing required headers', () => {
    const rows = [{ sku: 'A', name: 'B' }];
    const headers = ['sku', 'name']; // missing unit, current_qty, etc.
    const result = parser.parse(rows, headers);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Missing required columns');
  });

  it('valid rows pass despite other invalid rows', () => {
    const rows = [
      {
        sku: 'GOOD-1',
        name: 'Good',
        unit: 'unit',
        current_qty: 10,
        min_stock: 2,
        unit_cost_usd: 1,
        supplier: 'X',
      },
      {
        sku: 'BAD-1',
        name: 'Bad',
        unit: 'unit',
        current_qty: -1,
        min_stock: 2,
        unit_cost_usd: 1,
        supplier: null,
      },
      {
        sku: 'GOOD-2',
        name: 'Good2',
        unit: 'kg',
        current_qty: 5,
        min_stock: 1,
        unit_cost_usd: 2,
        supplier: null,
      },
    ];
    const result = parser.parse(rows);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
  });
});
