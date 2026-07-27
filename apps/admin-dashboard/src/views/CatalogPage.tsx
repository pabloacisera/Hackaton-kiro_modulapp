import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../controllers/useCatalog';
import { Pagination } from './components/Pagination';
import {
  CreatePrototypePayload,
  uploadPrototypeImage,
  deletePrototypeImage,
  createPrototype as createPrototypeApi,
} from '../models/catalogApi';

/**
 * TASK-admincatalog-2: CatalogPage — admin view for managing prototypes.
 * Table listing with create/edit modal, deactivate/reactivate actions.
 */
export function CatalogPage() {
  const {
    prototypes,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    setPage,
    update,
    deactivate,
    reactivate,
    reload,
  } = useCatalog();

  const createAndReturn = async (data: CreatePrototypePayload) => {
    const created = await createPrototypeApi(data);
    reload();
    return created;
  };

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
  const [editImages, setEditImages] = useState<{ id: string; url: string; order: number }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    setEditImages([]);
  };

  const handleCreate = async () => {
    if (!formData.name || formData.name.length < 2) {
      setFormError('El nombre es obligatorio (mínimo 2 caracteres)');
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setFormError('La descripción es obligatoria (mínimo 10 caracteres)');
      return;
    }
    if (formData.priceUsd <= 0) {
      setFormError('El precio debe ser mayor a 0');
      return;
    }
    if (formData.stockQty < 0) {
      setFormError('El stock no puede ser negativo');
      return;
    }
    setActionLoading(true);
    try {
      const created = await createAndReturn(formData);
      setEditId(created.id);
      setEditImages([]);
      setFormError(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear prototipo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setActionLoading(true);
    try {
      await update(editId, formData);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar prototipo');
    } finally {
      setActionLoading(false);
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
    setEditImages(p.images || []);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editId || !e.target.files?.[0]) return;
    setUploadingImage(true);
    setFormError(null);
    try {
      const newImg = await uploadPrototypeImage(editId, e.target.files[0]);
      setEditImages((prev) => [...prev, newImg]);
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (imageId: string) => {
    if (!editId) return;
    try {
      await deletePrototypeImage(editId, imageId);
      setEditImages((prev) => prev.filter((img) => img.id !== imageId));
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar imagen');
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers =
                'name,description,category,price_usd,stock_qty,build_on_demand,estimated_delivery_days,active';
              const example =
                'Nombre producto,Descripcion minimo 10 chars,modular_furniture,99.99,5,false,7,true';
              const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'plantilla-catalogo.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📄 Descargar plantilla
          </button>
          <Link
            to="/catalog/import"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📥 Importar Excel
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Agregar prototipo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Buscar prototipos"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          <option value="modular_furniture">Muebles Modulares</option>
          <option value="arches">Arcos</option>
        </select>
        <button
          onClick={reload}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Actualizar
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
        <p className="text-gray-500">Cargando...</p>
      ) : prototypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">📦</p>
          <p className="text-gray-500 mb-4">No hay prototipos en el catálogo aún.</p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Crear primer prototipo
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Tabla de prototipos">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Imágenes</th>
                <th className="px-3 py-2">Acciones</th>
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
                      {p.category === 'modular_furniture' ? 'Mueble Modular' : 'Arcos'}
                    </span>
                  </td>
                  <td className="px-3 py-2">${p.priceUsd.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {p.stockQty}
                    {p.buildOnDemand && (
                      <span className="ml-1 text-xs text-green-600" title="Fabricación bajo pedido">
                        (bajo pedido)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {p.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.images.length} img</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    {p.active ? (
                      <button
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            await deactivate(p.id);
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        {actionLoading ? '...' : 'Desactivar'}
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            await reactivate(p.id);
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                      >
                        {actionLoading ? '...' : 'Reactivar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && prototypes.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label={editId ? 'Editar prototipo' : 'Crear prototipo'}
        >
          <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editId ? 'Editar Prototipo' : 'Nuevo Prototipo'}
            </h2>
            {editId && !editImages.length && (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                ✅ Prototipo guardado. Ahora podés agregar imágenes.
              </div>
            )}
            <div className="flex flex-col gap-3">
              <input
                placeholder="Nombre (mín. 2 caracteres)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Nombre"
              />
              <textarea
                placeholder="Descripción (mín. 10 caracteres)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                rows={3}
                aria-label="Descripción"
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
                aria-label="Categoría"
              >
                <option value="modular_furniture">Mueble Modular</option>
                <option value="arches">Arcos</option>
              </select>
              <input
                type="number"
                placeholder="Precio (USD)"
                value={formData.priceUsd || ''}
                onChange={(e) =>
                  setFormData({ ...formData, priceUsd: parseFloat(e.target.value) || 0 })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Precio USD"
                min="0.01"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Cantidad en stock"
                value={formData.stockQty || ''}
                onChange={(e) =>
                  setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Cantidad en stock"
                min="0"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.buildOnDemand}
                  onChange={(e) => setFormData({ ...formData, buildOnDemand: e.target.checked })}
                />
                Fabricación bajo pedido (se puede comprar con stock 0)
              </label>
              <input
                type="number"
                placeholder="Días estimados de entrega (opcional)"
                value={formData.estimatedDeliveryDays ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDeliveryDays: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="rounded border px-3 py-2 text-sm"
                aria-label="Días estimados de entrega"
                min="1"
              />
              {/* Image upload section (only when editing) */}
              {editId && (
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Imágenes del producto</p>
                  {editImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt="Producto"
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />
                          <button
                            onClick={() => handleImageDelete(img.id)}
                            className="absolute -top-1 -right-1 hidden group-hover:flex w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-xs"
                            aria-label="Eliminar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingImage ? 'Subiendo...' : '📷 Subir imagen'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                      aria-label="Subir imagen del producto"
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">
                    JPEG, PNG, WebP o AVIF. Máx 5 MB.
                  </p>
                </div>
              )}
              {formError && (
                <div role="alert" className="text-xs text-red-600">
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="flex-1 rounded-lg border px-4 py-2 text-sm">
                  {editId ? 'Cerrar' : 'Cancelar'}
                </button>
                <button
                  onClick={editId ? handleUpdate : handleCreate}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Procesando...' : editId ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
