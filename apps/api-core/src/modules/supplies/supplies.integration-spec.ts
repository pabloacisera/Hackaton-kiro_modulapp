import { Test, TestingModule } from '@nestjs/testing';
import { SupplyCrudUseCase } from './use-cases/supply-crud.use-case';
import { ImportSupplyExcelUseCase } from './use-cases/import-supply-excel.use-case';
import { ConfirmSupplyImportUseCase } from './use-cases/confirm-supply-import.use-case';
import { LowStockCheckJob } from './jobs/low-stock-check.job';
import { ExcelParserService } from './services/excel-parser.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SUPPLY_REPOSITORY } from './repositories/supply.repository.port';
import { InMemorySupplyRepository } from './repositories/in-memory-supply.repository';

// Redis stub matching Upstash interface
function createRedisStub() {
  const store = new Map<string, { value: string; expiresAt: number | null }>();
  return {
    get: async (key: string): Promise<string | null> => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set: async (key: string, value: string, ...args: unknown[]): Promise<void> => {
      let expiresAt: number | null = null;
      if (args[0] === 'EX' && typeof args[1] === 'number') {
        expiresAt = Date.now() + args[1] * 1000;
      }
      store.set(key, { value, expiresAt });
    },
    del: async (key: string): Promise<void> => {
      store.delete(key);
    },
  };
}

describe('Supplies Module — Integration Tests', () => {
  let crud: SupplyCrudUseCase;
  let importExcel: ImportSupplyExcelUseCase;
  let confirmImport: ConfirmSupplyImportUseCase;
  let lowStockJob: LowStockCheckJob;
  let repo: InMemorySupplyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: SUPPLY_REPOSITORY, useClass: InMemorySupplyRepository },
        { provide: 'REDIS_CLIENT', useFactory: createRedisStub },
        SupplyCrudUseCase,
        ImportSupplyExcelUseCase,
        ConfirmSupplyImportUseCase,
        ExcelParserService,
        LowStockCheckJob,
        NotificationsService,
      ],
    }).compile();

    crud = module.get(SupplyCrudUseCase);
    importExcel = module.get(ImportSupplyExcelUseCase);
    confirmImport = module.get(ConfirmSupplyImportUseCase);
    lowStockJob = module.get(LowStockCheckJob);
    repo = module.get(SUPPLY_REPOSITORY);
  });

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  describe('CRUD', () => {
    it('creates a supply and reads it back', async () => {
      const supply = await crud.create(
        {
          sku: 'MDF-001',
          name: 'MDF Board',
          unit: 'm2',
          currentQty: 50,
          minStock: 10,
          unitCostUsd: 12.5,
          supplier: 'Acme',
        },
        'admin',
      );
      expect(supply.sku).toBe('MDF-001');

      const found = await crud.findById(supply.id);
      expect(found?.name).toBe('MDF Board');
    });

    it('updates supply and logs quantity change', async () => {
      const supply = await crud.create(
        {
          sku: 'NAIL-100',
          name: 'Nails',
          unit: 'kg',
          currentQty: 20,
          minStock: 5,
          unitCostUsd: 3,
          supplier: null,
        },
        'admin',
      );
      await crud.update(supply.id, { currentQty: 15 }, 'admin');

      const logs = repo.getChangeLogs();
      const qtyLogs = logs.filter((l: { supplyId: string }) => l.supplyId === supply.id);
      // 1 from create (0→20) + 1 from update (20→15)
      expect(qtyLogs).toHaveLength(2);
      expect(qtyLogs[1].previousQty).toBe(20);
      expect(qtyLogs[1].newQty).toBe(15);
      expect(qtyLogs[1].source).toBe('manual');
    });

    it('deletes a supply', async () => {
      const supply = await crud.create(
        {
          sku: 'DEL-1',
          name: 'Delete Me',
          unit: 'unit',
          currentQty: 1,
          minStock: 0,
          unitCostUsd: 1,
        },
        'admin',
      );
      await crud.delete(supply.id);
      const found = await crud.findById(supply.id);
      expect(found).toBeNull();
    });

    it('rejects duplicate SKU', async () => {
      await crud.create(
        { sku: 'DUP-1', name: 'A', unit: 'unit', currentQty: 1, minStock: 0, unitCostUsd: 1 },
        'admin',
      );
      await expect(
        crud.create(
          { sku: 'dup-1', name: 'B', unit: 'unit', currentQty: 2, minStock: 0, unitCostUsd: 2 },
          'admin',
        ),
      ).rejects.toThrow('already exists');
    });

    it('lists with search filter', async () => {
      await crud.create(
        {
          sku: 'MDF-A',
          name: 'MDF Board',
          unit: 'm2',
          currentQty: 10,
          minStock: 5,
          unitCostUsd: 10,
        },
        'admin',
      );
      await crud.create(
        {
          sku: 'NAIL-B',
          name: 'Nails Pack',
          unit: 'kg',
          currentQty: 5,
          minStock: 2,
          unitCostUsd: 3,
        },
        'admin',
      );

      const result = await crud.list({ search: 'nail' });
      expect(result.total).toBe(1);
      expect(result.items[0].sku).toBe('NAIL-B');
    });

    it('lists with belowMin filter', async () => {
      await crud.create(
        {
          sku: 'OK-1',
          name: 'OK Supply',
          unit: 'unit',
          currentQty: 100,
          minStock: 10,
          unitCostUsd: 1,
        },
        'admin',
      );
      await crud.create(
        {
          sku: 'LOW-1',
          name: 'Low Supply',
          unit: 'unit',
          currentQty: 3,
          minStock: 10,
          unitCostUsd: 1,
        },
        'admin',
      );

      const result = await crud.list({ belowMin: true });
      expect(result.total).toBe(1);
      expect(result.items[0].sku).toBe('LOW-1');
    });
  });

  // ── Excel Import ─────────────────────────────────────────────────────────────

  describe('Excel Import', () => {
    it('preview classifies new SKUs as toCreate', async () => {
      const rows = [
        {
          sku: 'NEW-1',
          name: 'New Item',
          unit: 'unit',
          current_qty: 10,
          min_stock: 5,
          unit_cost_usd: 3,
          supplier: '',
        },
      ];
      const result = await importExcel.preview(rows);
      expect(result.toCreate).toHaveLength(1);
      expect(result.toCreate[0].sku).toBe('NEW-1');
      expect(result.previewId).toBeDefined();
    });

    it('preview classifies existing SKUs with changes as toUpdate', async () => {
      await crud.create(
        {
          sku: 'EXIST-1',
          name: 'Old Name',
          unit: 'unit',
          currentQty: 10,
          minStock: 5,
          unitCostUsd: 5,
        },
        'admin',
      );

      const rows = [
        {
          sku: 'EXIST-1',
          name: 'New Name',
          unit: 'unit',
          current_qty: 20,
          min_stock: 5,
          unit_cost_usd: 5,
          supplier: '',
        },
      ];
      const result = await importExcel.preview(rows);
      expect(result.toUpdate).toHaveLength(1);
      expect(result.toUpdate[0].changes?.name).toEqual({ from: 'Old Name', to: 'New Name' });
    });

    it('preview reports invalid rows without blocking valid ones', async () => {
      const rows = [
        {
          sku: 'GOOD-1',
          name: 'Good',
          unit: 'unit',
          current_qty: 10,
          min_stock: 5,
          unit_cost_usd: 3,
          supplier: '',
        },
        {
          sku: 'BAD-1',
          name: 'Bad',
          unit: 'unit',
          current_qty: -5,
          min_stock: 5,
          unit_cost_usd: 3,
          supplier: '',
        },
      ];
      const result = await importExcel.preview(rows);
      expect(result.toCreate).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });

    it('confirm applies creates and updates with excel_import source', async () => {
      await crud.create(
        { sku: 'UPD-1', name: 'Old', unit: 'unit', currentQty: 5, minStock: 2, unitCostUsd: 1 },
        'admin',
      );

      const rows = [
        {
          sku: 'UPD-1',
          name: 'Updated',
          unit: 'unit',
          current_qty: 15,
          min_stock: 2,
          unit_cost_usd: 1,
          supplier: '',
        },
        {
          sku: 'NEW-X',
          name: 'Brand New',
          unit: 'kg',
          current_qty: 100,
          min_stock: 10,
          unit_cost_usd: 5,
          supplier: 'Vendor',
        },
      ];
      const preview = await importExcel.preview(rows);
      const result = await confirmImport.execute(preview.previewId, 'excel-admin');

      expect(result.applied).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify change log has excel_import source
      const logs = repo.getChangeLogs();
      const excelLogs = logs.filter((l: { source: string }) => l.source === 'excel_import');
      expect(excelLogs.length).toBeGreaterThan(0);
    });

    it('confirm rejects invalid/expired previewId', async () => {
      await expect(confirmImport.execute('non-existent', 'admin')).rejects.toThrow(
        'Invalid or expired preview ID',
      );
    });
  });

  // ── Low Stock Alert ──────────────────────────────────────────────────────────

  describe('Low Stock Alert', () => {
    it('notifies on first detection', async () => {
      await crud.create(
        {
          sku: 'LOW-A',
          name: 'Low Item',
          unit: 'unit',
          currentQty: 3,
          minStock: 10,
          unitCostUsd: 1,
        },
        'admin',
      );
      const count = await lowStockJob.execute();
      expect(count).toBe(1);
    });

    it('skips when already notified and unchanged', async () => {
      await crud.create(
        { sku: 'LOW-B', name: 'Low B', unit: 'unit', currentQty: 4, minStock: 10, unitCostUsd: 1 },
        'admin',
      );

      await lowStockJob.execute(); // first detection
      const count = await lowStockJob.execute(); // should skip
      expect(count).toBe(0);
    });

    it('notifies again when quantity worsened', async () => {
      const supply = await crud.create(
        { sku: 'LOW-C', name: 'Low C', unit: 'unit', currentQty: 5, minStock: 10, unitCostUsd: 1 },
        'admin',
      );
      await lowStockJob.execute(); // first detection (qty=5)

      // Worsen quantity
      await crud.update(supply.id, { currentQty: 2 }, 'admin');
      const count = await lowStockJob.execute();
      expect(count).toBe(1); // notified again because 2 < 5
    });

    it('does not notify supplies above minimum', async () => {
      await crud.create(
        { sku: 'OK-X', name: 'OK', unit: 'unit', currentQty: 100, minStock: 10, unitCostUsd: 1 },
        'admin',
      );
      const count = await lowStockJob.execute();
      expect(count).toBe(0);
    });
  });
});
