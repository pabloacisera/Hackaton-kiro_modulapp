import { useState } from 'react';
import { useSupplies } from '../controllers/useSupplies';

/**
 * TASK-stock-8: SuppliesPage — table with search, below-minimum toggle,
 * create/edit/delete actions.
 */
export function SuppliesPage() {
  const {
    supplies,
    total,
    loading,
    error,
    search,
    setSearch,
    belowMinOnly,
    setBelowMinOnly,
    create,
    update,
    remove,
    reload,
  } = useSupplies();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unit: 'unit',
    currentQty: '0',
    minStock: '0',
    unitCostUsd: '0',
    supplier: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      unit: 'unit',
      currentQty: '0',
      minStock: '0',
      unitCostUsd: '0',
      supplier: '',
    });
    setEditId(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    try {
      await create({
        sku: formData.sku,
        name: formData.name,
        unit: formData.unit,
        currentQty: parseFloat(formData.currentQty),
        minStock: parseFloat(formData.minStock),
        unitCostUsd: parseFloat(formData.unitCostUsd),
        supplier: formData.supplier || undefined,
      });
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      await update(editId, {
        name: formData.name,
        unit: formData.unit,
        currentQty: parseFloat(formData.currentQty),
        minStock: parseFloat(formData.minStock),
        unitCostUsd: parseFloat(formData.unitCostUsd),
        supplier: formData.supplier || undefined,
      });
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const startEdit = (s: (typeof supplies)[0]) => {
    setEditId(s.id);
    setFormData({
      sku: s.sku,
      name: s.name,
      unit: s.unit,
      currentQty: String(s.currentQty),
      minStock: String(s.minStock),
      unitCostUsd: String(s.unitCostUsd),
      supplier: s.supplier ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Supplies</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Supply
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Search supplies"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={belowMinOnly}
            onChange={(e) => setBelowMinOnly(e.target.checked)}
          />
          Below minimum only
        </label>
        <button
          onClick={reload}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : supplies.length === 0 ? (
        <p className="text-gray-500">No supplies found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Supplies table">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Min</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b hover:bg-gray-50 ${s.currentQty < s.minStock ? 'bg-red-50' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">{s.sku}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">
                    {s.currentQty} {s.unit}
                  </td>
                  <td className="px-3 py-2">{s.minStock}</td>
                  <td className="px-3 py-2">${s.unitCostUsd}</td>
                  <td className="px-3 py-2">{s.supplier ?? '—'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editId ? 'Edit Supply' : 'New Supply'}</h2>
            <div className="flex flex-col gap-3">
              {!editId && (
                <input
                  placeholder="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                  aria-label="SKU"
                />
              )}
              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Name"
              />
              <input
                placeholder="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Unit"
              />
              <input
                type="number"
                placeholder="Qty"
                value={formData.currentQty}
                onChange={(e) => setFormData({ ...formData, currentQty: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Current quantity"
              />
              <input
                type="number"
                placeholder="Min Stock"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Minimum stock"
              />
              <input
                type="number"
                placeholder="Unit Cost USD"
                value={formData.unitCostUsd}
                onChange={(e) => setFormData({ ...formData, unitCostUsd: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Unit cost"
              />
              <input
                placeholder="Supplier (optional)"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Supplier"
              />
              {formError && (
                <div role="alert" className="text-xs text-red-600">
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="flex-1 rounded-lg border px-4 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={editId ? handleUpdate : handleCreate}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
