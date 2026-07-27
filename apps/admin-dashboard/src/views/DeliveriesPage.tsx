import { useState } from 'react';
import { useDeliveries } from '../controllers/useDeliveries';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import type { DeliveryStatus } from '../models/deliveriesApi';

const STATUS_OPTIONS: { value: DeliveryStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'delivered', label: 'Entregado' },
];

/**
 * TASK-delivery-5/6: DeliveriesPage — unified delivery schedule view.
 * Shows accepted orders + paid quotes sorted by delivery date.
 * Overdue items are visually highlighted.
 */
export function DeliveriesPage() {
  const {
    deliveries,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    deliver,
    postpone,
    reload,
  } = useDeliveries();

  const [actionLoading, setActionLoading] = useState(false);

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendario de Entregas</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, email..."
        />
        <select
          value={statusFilter ?? ''}
          onChange={(e) =>
            setStatusFilter(e.target.value ? (e.target.value as DeliveryStatus) : undefined)
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={reload}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Actualizar
        </button>
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
      ) : deliveries.length === 0 ? (
        <p className="text-gray-500">No hay entregas programadas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Tabla de entregas">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Origen</th>
                <th className="px-3 py-2">Fecha de entrega</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr
                  key={`${d.origin}-${d.id}`}
                  className={`border-b hover:bg-gray-50 ${d.status === 'overdue' ? 'bg-red-50' : ''}`}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium">{d.customerName}</p>
                    <p className="text-xs text-gray-500">{d.customerEmail}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                      {d.origin}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {new Date(d.estimatedDeliveryDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        d.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : d.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {d.status !== 'delivered' && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await deliver(d.origin, d.id);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Marcar entregado'}
                        </button>
                        <button
                          onClick={async () => {
                            const newDate = prompt('Nueva fecha de entrega (AAAA-MM-DD):');
                            if (!newDate) return;
                            setActionLoading(true);
                            try {
                              await postpone(d.origin, d.id, newDate);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Posponer'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && deliveries.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
