import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuotes } from '../controllers/useQuotes';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import type { QuoteDto, QuoteStatus } from '../models/quotesApi';

const STATUS_OPTIONS: { value: QuoteStatus | ''; label: string }[] = [
  { value: '', label: 'Todas (sin archivadas)' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'quoted', label: 'Cotizada' },
  { value: 'accepted', label: 'Aceptada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'expired', label: 'Expirada' },
  { value: 'payment_initiated', label: 'Pago iniciado' },
  { value: 'paid', label: 'Pagada' },
  { value: 'payment_expired', label: 'Pago expirado' },
];

/**
 * TASK-quoteB-19: Admin UI — quotes management page with quoting form.
 */
export function QuotesPage() {
  const [searchParams] = useSearchParams();
  const {
    quotes,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    present,
    adminReject,
    archive,
    reload,
  } = useQuotes();
  const [presentModal, setPresentModal] = useState<QuoteDto | null>(null);
  const [detailQuote, setDetailQuote] = useState<QuoteDto | null>(null);
  const [priceUsd, setPriceUsd] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize search from URL query param (e.g. /admin/quotes?q=<quoteId>)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresent = async () => {
    if (!presentModal) return;
    const price = parseFloat(priceUsd);
    const days = parseInt(leadTimeDays, 10);
    if (isNaN(price) || price <= 0 || isNaN(days) || days <= 0 || !estimatedDeliveryDate) {
      setActionError('Por favor completa todos los campos con valores válidos.');
      return;
    }
    setActionLoading(true);
    try {
      await present(presentModal.id, price, days, estimatedDeliveryDate);
      setPresentModal(null);
      setPriceUsd('');
      setLeadTimeDays('');
      setEstimatedDeliveryDate('');
      setActionError(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al presentar cotización');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (quoteId: string) => {
    setActionLoading(true);
    try {
      await archive(quoteId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al archivar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminReject = async (quoteId: string) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason || !reason.trim()) return;
    setActionLoading(true);
    try {
      await adminReject(quoteId, reason);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setActionLoading(false);
    }
  };

  const canPresent = (q: QuoteDto) => q.status === 'pending';
  const canArchive = (q: QuoteDto) =>
    q.status === 'rejected' || q.status === 'expired' || q.status === 'payment_expired';

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, email..."
        />
        <label htmlFor="quote-status-filter" className="text-sm font-medium text-gray-700">
          Estado:
        </label>
        <select
          id="quote-status-filter"
          value={statusFilter ?? ''}
          onChange={(e) =>
            setStatusFilter(e.target.value ? (e.target.value as QuoteStatus) : undefined)
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
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
        <p className="text-gray-500">Cargando cotizaciones...</p>
      ) : quotes.length === 0 ? (
        <p className="text-gray-500">No se encontraron cotizaciones.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Quotes table">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Fecha límite</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setDetailQuote(q)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{q.customerName}</p>
                    <p className="text-xs text-gray-500">{q.customerEmail}</p>
                    <p className="text-xs text-gray-400">{q.customerPhone}</p>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-700">{q.description}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{q.quotedPriceUsd ? `$${q.quotedPriceUsd}` : '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {q.neededByDate ? new Date(q.neededByDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailQuote(q);
                        }}
                        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Ver
                      </button>
                      {canPresent(q) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPresentModal(q);
                          }}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Cotizar
                        </button>
                      )}
                      {canPresent(q) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminReject(q.id);
                          }}
                          disabled={actionLoading}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Rechazar'}
                        </button>
                      )}
                      {canArchive(q) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(q.id);
                          }}
                          disabled={actionLoading}
                          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Archivar'}
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
      {!loading && quotes.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}

      {/* Quote Detail Modal */}
      {detailQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Detalle de Solicitud de Cotización
              </h2>
              <button
                onClick={() => setDetailQuote(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cliente */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Cliente</h3>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500">Nombre:</span>{' '}
                  <span className="font-medium text-gray-900">{detailQuote.customerName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-900">{detailQuote.customerEmail}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Teléfono:</span>{' '}
                  <span className="text-gray-900">{detailQuote.customerPhone}</span>
                </p>
              </div>
            </div>

            {/* Descripción del pedido */}
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Descripción del pedido</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {detailQuote.description || 'Sin descripción proporcionada'}
              </p>
            </div>

            {/* Información de la solicitud */}
            <div className="mb-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Información</h3>
              <QuoteDetailRow label="Estado" value={detailQuote.status.replace(/_/g, ' ')} />
              <QuoteDetailRow
                label="Fecha necesaria"
                value={
                  detailQuote.neededByDate
                    ? new Date(detailQuote.neededByDate).toLocaleDateString()
                    : 'No especificada'
                }
              />
              <QuoteDetailRow
                label="Fecha de creación"
                value={new Date(detailQuote.createdAt).toLocaleString()}
              />
            </div>

            {/* Cotización (si fue presentada) */}
            {detailQuote.quotedPriceUsd && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Cotización presentada</h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-gray-600">Precio:</span>{' '}
                    <span className="font-bold text-green-800">
                      ${detailQuote.quotedPriceUsd} USD
                    </span>
                  </p>
                  {detailQuote.quotedLeadTimeDays && (
                    <p className="text-sm">
                      <span className="text-gray-600">Tiempo de producción:</span>{' '}
                      <span className="text-gray-900">{detailQuote.quotedLeadTimeDays} días</span>
                    </p>
                  )}
                  {detailQuote.estimatedDeliveryDate && (
                    <p className="text-sm">
                      <span className="text-gray-600">Entrega estimada:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(detailQuote.estimatedDeliveryDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                  {detailQuote.quoteSentAt && (
                    <p className="text-sm">
                      <span className="text-gray-600">Cotización enviada:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(detailQuote.quoteSentAt).toLocaleString()}
                      </span>
                    </p>
                  )}
                  {detailQuote.quoteResponseDeadline && (
                    <p className="text-sm">
                      <span className="text-gray-600">Vence:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(detailQuote.quoteResponseDeadline).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fechas de resolución */}
            {(detailQuote.acceptedAt || detailQuote.rejectedAt || detailQuote.paidAt) && (
              <div className="mb-4 space-y-1">
                {detailQuote.acceptedAt && (
                  <QuoteDetailRow
                    label="Aceptada"
                    value={new Date(detailQuote.acceptedAt).toLocaleString()}
                  />
                )}
                {detailQuote.rejectedAt && (
                  <QuoteDetailRow
                    label="Rechazada"
                    value={new Date(detailQuote.rejectedAt).toLocaleString()}
                  />
                )}
                {detailQuote.paidAt && (
                  <QuoteDetailRow
                    label="Pagada"
                    value={new Date(detailQuote.paidAt).toLocaleString()}
                  />
                )}
                {detailQuote.paymentDeadline && (
                  <QuoteDetailRow
                    label="Vencimiento de pago"
                    value={new Date(detailQuote.paymentDeadline).toLocaleString()}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              {canPresent(detailQuote) && (
                <button
                  onClick={() => {
                    setDetailQuote(null);
                    setPresentModal(detailQuote);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Cotizar
                </button>
              )}
              <button
                onClick={() => setDetailQuote(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Present Quote Modal */}
      {presentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Presentar Cotización</h2>
            <p className="mb-1 text-sm text-gray-600">
              Cliente: <strong>{presentModal.customerName}</strong> ({presentModal.customerEmail})
            </p>
            <p className="mb-4 text-sm text-gray-600">Solicitud: {presentModal.description}</p>

            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="present-price"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Precio (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  id="present-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="250.00"
                />
              </div>
              <div>
                <label
                  htmlFor="present-days"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Tiempo de producción (días) <span className="text-red-500">*</span>
                </label>
                <input
                  id="present-days"
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="14"
                />
              </div>
              <div>
                <label
                  htmlFor="present-delivery-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Fecha estimada de entrega <span className="text-red-500">*</span>
                </label>
                <input
                  id="present-delivery-date"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {actionError && (
                <div
                  role="alert"
                  className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
                >
                  {actionError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setPresentModal(null);
                    setActionError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePresent}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Procesando...' : 'Enviar cotización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}
