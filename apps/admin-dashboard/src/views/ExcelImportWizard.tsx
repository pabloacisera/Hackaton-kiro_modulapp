import { useExcelImport } from '../controllers/useExcelImport';
import { exportSupplies } from '../models/suppliesApi';
import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * TASK-stock-9: ExcelImportWizard — upload → preview with colored diffs → confirm.
 * Three steps: upload file, review changes, confirm apply.
 * Follows same visual pattern as CatalogImportWizard.
 */
export function ExcelImportWizard() {
  const { step, preview, confirmResult, loading, error, uploadData, confirm, reset } =
    useExcelImport();
  const [exportLoading, setExportLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const rows = JSON.parse(text) as Record<string, unknown>[];
      await uploadData(rows);
    } catch {
      // Try CSV/TSV parsing fallback
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return;
      const delim = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delim).map((h) =>
        h
          .trim()
          .toLowerCase()
          .replace(/^\uFEFF/, ''),
      );
      const rows = lines.slice(1).map((line) => {
        const values = line.split(delim).map((v) => v.trim());
        const row: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] ?? '';
        });
        return row;
      });
      await uploadData(rows);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const data = await exportSupplies();
      const csv = [
        data.headers.join(','),
        ...data.rows.map((row) =>
          data.headers
            .map((h) => {
              const val = row[h];
              if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
              return val ?? '';
            })
            .join(','),
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'suministros-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silently fail */
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'sku,name,unit,current_qty,min_stock,unit_cost_usd,supplier';
    const example1 = 'MDF-18MM,Plancha MDF 18mm,sheet,25,10,12.50,Maderas del Sur';
    const example2 = 'TORN-4X30,Tornillo 4x30mm,box,100,20,3.20,Ferreteria Central';
    const csv = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-suministros.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Importar Suministros desde Excel/CSV</h2>
        <Link to="/supplies" className="text-sm text-blue-600 hover:underline">
          ← Volver a suministros
        </Link>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Sube un archivo CSV o JSON con los suministros
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Columnas: sku, name, unit, current_qty, min_stock, unit_cost_usd, supplier
            </p>
            <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Seleccionar archivo
              <input
                type="file"
                accept=".json,.csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Subir archivo de suministros"
              />
            </label>
            {loading && <p className="mt-4 text-sm text-gray-500">Procesando archivo...</p>}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          {/* Helper buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              📥 Descargar plantilla
            </button>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {exportLoading ? 'Exportando...' : '📤 Exportar inventario actual'}
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Instrucciones</h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>
                Los suministros se identifican por <strong>SKU</strong>: si el SKU ya existe, se
                actualiza; si no, se crea uno nuevo.
              </li>
              <li>
                Unidades válidas: <code>unit</code>, <code>sheet</code>, <code>box</code>,
                <code>kg</code>, <code>liter</code>, <code>meter</code>, o cualquier texto libre.
              </li>
              <li>
                <code>current_qty</code> y <code>min_stock</code> deben ser números ≥ 0.
              </li>
              <li>
                <code>unit_cost_usd</code>: costo unitario en USD (puede ser 0).
              </li>
              <li>
                <code>supplier</code>: opcional, nombre del proveedor.
              </li>
              <li>Puedes exportar el inventario actual como base para hacer cambios.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vista previa de cambios</h3>
            <button onClick={reset} className="text-sm text-gray-500 hover:underline">
              Cancelar
            </button>
          </div>

          {/* Creates */}
          {preview.toCreate.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-green-700">
                ✅ Se crearán ({preview.toCreate.length})
              </h4>
              <ul className="space-y-1">
                {preview.toCreate.map((item) => (
                  <li key={item.sku} className="rounded bg-green-50 px-3 py-1 text-sm">
                    <span className="font-mono font-medium">{item.sku}</span>
                    <span className="ml-2 text-gray-600">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Updates */}
          {preview.toUpdate.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-yellow-700">
                ✏️ Se actualizarán ({preview.toUpdate.length})
              </h4>
              <ul className="space-y-1">
                {preview.toUpdate.map((item) => (
                  <li key={item.sku} className="rounded bg-yellow-50 px-3 py-2 text-sm">
                    <span className="font-mono font-medium">{item.sku}</span>
                    <span className="ml-2 text-gray-600">{item.name}</span>
                    {item.changes && (
                      <span className="ml-2 text-xs text-gray-500">
                        Campos: {Object.keys(item.changes).join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-red-700">
                ❌ Errores ({preview.errors.length})
              </h4>
              <ul className="space-y-1">
                {preview.errors.map((err, i) => (
                  <li key={i} className="rounded bg-red-50 px-3 py-1 text-sm">
                    Fila {err.row}: <span className="font-medium">{err.field}</span> — {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={loading || (preview.toCreate.length === 0 && preview.toUpdate.length === 0)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              aria-busy={loading}
            >
              {loading ? 'Aplicando...' : 'Confirmar importación'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && confirmResult && (
        <div className="text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">Importación completada</h3>
          <p className="text-sm text-gray-600">
            {confirmResult.applied} suministros procesados exitosamente.
          </p>
          {confirmResult.errors.length > 0 && (
            <div className="mt-4 text-left">
              <h4 className="text-sm font-medium text-red-700">Errores:</h4>
              <ul className="mt-1 space-y-1">
                {confirmResult.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600">
                    {err.sku}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Importar otro archivo
            </button>
            <Link
              to="/supplies"
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ver suministros
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
