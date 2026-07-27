import { useState, useEffect } from 'react';
import { useOrders } from '../controllers/useOrders';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import { OrderDto, OrderStatus } from '../models/ordersApi';
import { fetchAdminPrototypeById, AdminPrototypeDto } from '../models/catalogApi';

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Creada',
  payment_initiated: 'Pago iniciado',
  paid_pending_acceptance: 'Pendiente de aceptación',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  payment_failed: 'Pago fallido',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'bg-gray-100 text-gray-700',
  payment_initiated: 'bg-blue-100 text-blue-700',
  paid_pending_acceptance: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  payment_failed: 'bg-orange-100 text-orange-700',
};

/**
 * TASK-directpurchase-13: Admin orders table with accept/reject actions.
 */
export function OrdersPage() {
  const {
    orders,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    accept,
    reject,
  } = useOrders();

  const [actionError, setActionError] = useState<string | null>(null);

  // ── Detail modal state ────────────────────────────────────────────────────
  const [detailOrder, setDetailOrder] = useState<OrderDto | null>(null);

  // ── Accept dialog state ───────────────────────────────────────────────────
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [eta, setEta] = useState('');

  // ── Reject dialog state ───────────────────────────────────────────────────
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = async () => {
    if (!acceptingId || !eta) return;
    setActionError(null);
    try {
      await accept(acceptingId, eta);
      setAcceptingId(null);
      setEta('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al aceptar');
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    setActionError(null);
    try {
      await reject(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al rechazar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Órdenes</h1>

        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por email, nombre..."
        />

        {/* Status filter */}
        <select
          value={statusFilter ?? ''}
          onChange={(e) => {
            setStatusFilter((e.target.value as OrderStatus) || undefined);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Orders table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm" aria-label="Orders table">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No se encontraron órdenes.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onDetail={() => setDetailOrder(order)}
                  onAccept={() => {
                    setAcceptingId(order.id);
                    setActionError(null);
                  }}
                  onReject={() => {
                    setRejectingId(order.id);
                    setActionError(null);
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}

      {/* Order Detail modal */}
      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {/* Accept modal */}
      {acceptingId && (
        <Modal title="Aceptar orden" onClose={() => setAcceptingId(null)}>
          <p className="mb-4 text-sm text-gray-600">
            Establece una fecha estimada de entrega para el cliente.
          </p>
          <label htmlFor="accept-eta" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha estimada de entrega <span className="text-red-500">*</span>
          </label>
          <input
            id="accept-eta"
            type="date"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            aria-label="Fecha estimada de entrega"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAcceptingId(null)}
              className="rounded px-4 py-2 text-sm border border-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleAccept}
              disabled={!eta}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Confirmar aceptación
            </button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <Modal title="Rechazar orden" onClose={() => setRejectingId(null)}>
          <p className="mb-2 text-sm text-red-600 font-medium">
            Esto generará automáticamente un reembolso completo al cliente.
          </p>
          <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium text-gray-700">
            Motivo del rechazo <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Ej: Sin stock en almacén, material no disponible…"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
            aria-label="Motivo del rechazo"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectingId(null)}
              className="rounded px-4 py-2 text-sm border border-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Rechazar y reembolsar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function OrderRow({
  order,
  onAccept,
  onReject,
  onDetail,
}: {
  order: OrderDto;
  onAccept: () => void;
  onReject: () => void;
  onDetail: () => void;
}) {
  const isPending = order.status === 'paid_pending_acceptance';

  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onDetail}>
      <td className="px-4 py-3 font-mono text-xs text-gray-500">
        #{order.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{order.customerEmail}</p>
        {order.customerName && <p className="text-xs text-gray-500">{order.customerName}</p>}
      </td>
      <td className="px-4 py-3 font-semibold text-gray-800">
        ${Number(order.priceUsdSnapshot).toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetail();
            }}
            className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            aria-label={`Ver detalle orden ${order.id}`}
          >
            Ver
          </button>
          {isPending && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                aria-label={`Accept order ${order.id}`}
              >
                Aceptar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                aria-label={`Reject order ${order.id}`}
              >
                Rechazar
              </button>
            </>
          )}
        </div>
        {order.status === 'rejected' && order.rejectionReason && (
          <p className="text-xs text-gray-500 max-w-xs truncate mt-1" title={order.rejectionReason}>
            {order.rejectionReason}
          </p>
        )}
      </td>
    </tr>
  );
}

function OrderDetailModal({ order, onClose }: { order: OrderDto; onClose: () => void }) {
  const [prototype, setPrototype] = useState<AdminPrototypeDto | null>(null);
  const [loadingProto, setLoadingProto] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingProto(true);
    fetchAdminPrototypeById(order.prototypeId)
      .then((p) => {
        if (!cancelled) setPrototype(p);
      })
      .catch(() => {
        if (!cancelled) setPrototype(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProto(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order.prototypeId]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de orden"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Detalle de Orden</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Producto */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Producto</h3>
          {loadingProto ? (
            <p className="text-sm text-gray-400">Cargando producto...</p>
          ) : prototype ? (
            <div className="flex gap-3">
              {prototype.images.length > 0 && (
                <img
                  src={prototype.images[0].url}
                  alt={prototype.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{prototype.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {prototype.category.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prototype.description}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Producto no encontrado (ID: {order.prototypeId.slice(0, 8)})
            </p>
          )}
        </div>

        {/* Info de la orden */}
        <div className="space-y-3">
          <DetailRow label="ID de Orden" value={`#${order.id.slice(0, 8).toUpperCase()}`} mono />
          <DetailRow
            label="Estado"
            value={STATUS_LABELS[order.status]}
            badge={STATUS_COLORS[order.status]}
          />
          <DetailRow label="Monto" value={`$${Number(order.priceUsdSnapshot).toFixed(2)} USD`} />
          <DetailRow label="Cliente" value={order.customerName || '—'} />
          <DetailRow label="Email" value={order.customerEmail} />
          <DetailRow label="Fecha de creación" value={new Date(order.createdAt).toLocaleString()} />
          <DetailRow
            label="Última actualización"
            value={new Date(order.updatedAt).toLocaleString()}
          />
          {order.estimatedDeliveryDate && (
            <DetailRow
              label="Entrega estimada"
              value={new Date(order.estimatedDeliveryDate).toLocaleDateString()}
            />
          )}
          {order.rejectionReason && (
            <DetailRow label="Motivo de rechazo" value={order.rejectionReason} />
          )}
          {order.paymentServiceRef && (
            <DetailRow label="Ref. de pago" value={order.paymentServiceRef} mono />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      {badge ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>{value}</span>
      ) : (
        <span className={`text-sm text-gray-900 text-right ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
        {children}
      </div>
    </>
  );
}
