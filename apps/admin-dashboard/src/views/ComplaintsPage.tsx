import { useState } from 'react';
import { useComplaints } from '../controllers/useComplaints';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import type { ComplaintStatus } from '../models/complaintsApi';

const STATUS_OPTIONS: { value: ComplaintStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'received', label: 'Recibido' },
  { value: 'under_review', label: 'En revisión' },
  { value: 'refund_approved', label: 'Reembolso aprobado' },
  { value: 'resolved_other_way', label: 'Resuelto' },
  { value: 'rejected', label: 'Rechazado' },
];

/**
 * TASK-complaint-9: Admin complaints table with actions.
 */
export function ComplaintsPage() {
  const {
    complaints,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    review,
    refund,
    resolve,
    reload,
  } = useComplaints();

  const [actionLoading, setActionLoading] = useState(false);
  const canReview = (status: ComplaintStatus) => status === 'received';
  const canRefund = (status: ComplaintStatus) => status === 'under_review';
  const canResolve = (status: ComplaintStatus) => status === 'under_review';

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reclamos</h1>
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
            setStatusFilter(e.target.value ? (e.target.value as ComplaintStatus) : undefined)
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
      ) : complaints.length === 0 ? (
        <p className="text-gray-500">No se encontraron reclamos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Tabla de reclamos">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Referencia</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-medium">{c.customerName}</p>
                    <p className="text-xs text-gray-500">{c.customerEmail}</p>
                  </td>
                  <td className="px-3 py-2 text-xs font-mono">
                    {c.referenceType}/{c.referenceId ?? '—'}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2">{c.reason}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {canReview(c.status) && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await review(c.id);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="rounded px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Revisar'}
                        </button>
                      )}
                      {canRefund(c.status) && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await refund(c.id);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="rounded px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Aprobar reembolso'}
                        </button>
                      )}
                      {canResolve(c.status) && (
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await resolve(
                                c.id,
                                'Resolved via admin action',
                                'resolved_other_way',
                              );
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="rounded px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Resolver'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && complaints.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
