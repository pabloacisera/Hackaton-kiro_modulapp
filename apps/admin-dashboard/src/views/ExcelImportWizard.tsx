import { useExcelImport } from '../controllers/useExcelImport';

/**
 * TASK-stock-9: ExcelImportWizard — upload → preview with colored diffs → confirm.
 * Three steps: upload file, review changes, confirm apply.
 */
export function ExcelImportWizard() {
  const { step, preview, confirmResult, loading, error, uploadData, confirm, reset } =
    useExcelImport();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Parse CSV/JSON file (in production: use xlsx parser on client side)
    const text = await file.text();
    try {
      const rows = JSON.parse(text) as Record<string, unknown>[];
      await uploadData(rows);
    } catch {
      // Try CSV parsing fallback
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] ?? '';
        });
        return row;
      });
      await uploadData(rows);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Importar Suministros desde Excel</h2>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="mb-4 text-sm text-gray-600">
            Sube un archivo JSON o CSV con columnas: sku, name, unit, current_qty, min_stock,
            unit_cost_usd, supplier
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
                    <span className="font-mono">{item.sku}</span> — {item.name}
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
                  <li key={item.sku} className="rounded bg-yellow-50 px-3 py-1 text-sm">
                    <span className="font-mono">{item.sku}</span> — {item.name}
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
                    Row {err.row}: <span className="font-medium">{err.field}</span> — {err.message}
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
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}
