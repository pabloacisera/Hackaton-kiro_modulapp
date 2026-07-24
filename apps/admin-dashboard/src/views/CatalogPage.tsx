import { useState } from 'react';
import { useCatalog } from '../controllers/useCatalog';
import { CreatePrototypePayload } from '../models/catalogApi';

/**
 * TASK-admincatalog-2: CatalogPage — admin view for managing prototypes.
 * Table listing with create/edit modal, deactivate/reactivate actions.
 */
export function CatalogPage() {
  const {
    prototypes,
    total,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    create,
    update,
    deactivate,
    reactivate,
    reload,
  } = useCatalog();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePrototypePayload>({
    name: '',
    description: '',
    category: 'modular_furniture',
    priceUsd: 0,
    stockQty: 0,
    buildOnDemand: false,
    estimatedDeliveryDays: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'modular_furniture',
      priceUsd: 0,
      stockQty: 0,
      buildOnDemand: false,
      estimatedDeliveryDays: null,
    });
    setEditId(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    if (!formData.name || formData.name.length < 2) {
      setFormError('Name is required (min 2 chars)');
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setFormError('Description is required (min 10 chars)');
      return;
    }
    if (formData.priceUsd <= 0) {
      setFormError('Price must be greater than 0');
      return;
    }
    if (formData.stockQty < 0) {
      setFormError('Stock cannot be negative');
      return;
    }
    try {
      await create(formData);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create prototype');
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      await update(editId, formData);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update prototype');
    }
  };

  const startEdit = (p: (typeof prototypes)[0]) => {
    setEditId(p.id);
    setFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      priceUsd: p.priceUsd,
      stockQty: p.stockQty,
      buildOnDemand: p.buildOnDemand,
      estimatedDeliveryDays: p.estimatedDeliveryDays,
    });
    setShowForm(true);
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Prototype
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Search prototypes"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          <option value="modular_furniture">Modular Furniture</option>
          <option value="arches">Arches</option>
        </select>
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
      ) : prototypes.length === 0 ? (
        <p className="text-gray-500">No prototypes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Prototypes table">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Images</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prototypes.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b hover:bg-gray-50 ${!p.active ? 'bg-gray-100 opacity-60' : ''}`}
                >
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      {p.category === 'modular_furniture' ? 'Furniture' : 'Arches'}
                    </span>
                  </td>
                  <td className="px-3 py-2">${p.priceUsd.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {p.stockQty}
                    {p.buildOnDemand && (
                      <span className="ml-1 text-xs text-green-600" title="Build on demand">
                        (on-demand)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {p.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.images.length} img</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {p.active ? (
                      <button
                        onClick={() => deactivate(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivate(p.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Reactivate
                      </button>
                    )}
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
          aria-label={editId ? 'Edit prototype' : 'Create prototype'}
        >
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editId ? 'Edit Prototype' : 'New Prototype'}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                placeholder="Name (min 2 chars)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Name"
              />
              <textarea
                placeholder="Description (min 10 chars)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                rows={3}
                aria-label="Description"
              />
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as 'modular_furniture' | 'arches',
                  })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Category"
              >
                <option value="modular_furniture">Modular Furniture</option>
                <option value="arches">Arches</option>
              </select>
              <input
                type="number"
                placeholder="Price (USD)"
                value={formData.priceUsd || ''}
                onChange={(e) =>
                  setFormData({ ...formData, priceUsd: parseFloat(e.target.value) || 0 })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Price USD"
                min="0.01"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Stock quantity"
                value={formData.stockQty || ''}
                onChange={(e) =>
                  setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Stock quantity"
                min="0"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.buildOnDemand}
                  onChange={(e) => setFormData({ ...formData, buildOnDemand: e.target.checked })}
                />
                Build on demand (purchasable even with 0 stock)
              </label>
              <input
                type="number"
                placeholder="Estimated delivery days (optional)"
                value={formData.estimatedDeliveryDays ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDeliveryDays: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Estimated delivery days"
                min="1"
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
