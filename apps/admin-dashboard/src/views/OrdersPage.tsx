import { useState } from 'react';
import { useOrders } from '../controllers/useOrders';
import { OrderDto, OrderStatus } from '../models/ordersApi';

const STATUS_LABELS: Record<OrderStatus, string> = {
  created:                  'Created',
  payment_initiated:        'Payment initiated',
  paid_pending_acceptance:  'Pending acceptance',
  accepted:                 'Accepted',
  rejected:                 'Rejected',
  payment_failed:           'Payment failed',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  created:                  'bg-gray-100 text-gray-700',
  payment_initiated:        'bg-blue-100 text-blue-700',
  paid_pending_acceptance:  'bg-yellow-100 text-yellow-800',
  accepted:                 'bg-green-100 text-green-700',
  rejected:                 'bg-red-100 text-red-700',
  payment_failed:           'bg-orange-100 text-orange-700',
};

/**
 * TASK-directpurchase-13: Admin orders table with accept/reject actions.
 */
export function OrdersPage() {
  const {
    orders, total, page, loading, error,
    statusFilter, setStatusFilter, setPage,
    accept, reject,
  } = useOrders();

  const [actionError, setActionError] = useState<string | null>(null);

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
      setActionError(err instanceof Error ? err.message : 'Accept failed');
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
      setActionError(err instanceof Error ? err.message : 'Reject failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>

        {/* Status filter */}
        <select
          value={statusFilter ?? ''}
          onChange={(e) => {
            setStatusFilter((e.target.value as OrderStatus) || undefined);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => <OrderRow
                key={order.id}
                order={order}
                onAccept={() => { setAcceptingId(order.id); setActionError(null); }}
                onReject={() => { setRejectingId(order.id); setActionError(null); }}
              />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded px-3 py-1 text-sm border border-gray-300 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
            className="rounded px-3 py-1 text-sm border border-gray-300 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Accept modal */}
      {acceptingId && (
        <Modal title="Accept order" onClose={() => setAcceptingId(null)}>
          <p className="mb-4 text-sm text-gray-600">
            Set an estimated delivery date for the customer.
          </p>
          <label htmlFor="accept-eta" className="mb-1 block text-sm font-medium text-gray-700">
            Estimated delivery date <span className="text-red-500">*</span>
          </label>
          <input
            id="accept-eta"
            type="date"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            aria-label="Estimated delivery date"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAcceptingId(null)} className="rounded px-4 py-2 text-sm border border-gray-300">
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!eta}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Confirm acceptance
            </button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <Modal title="Reject order" onClose={() => setRejectingId(null)}>
          <p className="mb-2 text-sm text-red-600 font-medium">
            This will automatically trigger a full refund to the customer.
          </p>
          <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium text-gray-700">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. Out of stock in warehouse, material unavailable…"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
            aria-label="Rejection reason"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectingId(null)} className="rounded px-4 py-2 text-sm border border-gray-300">
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject & refund
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function OrderRow({ order, onAccept, onReject }: {
  order: OrderDto;
  onAccept: () => void;
  onReject: () => void;
}) {
  const isPending = order.status === 'paid_pending_acceptance';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-xs text-gray-500">
        #{order.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{order.customerEmail}</p>
        {order.customerName && (
          <p className="text-xs text-gray-500">{order.customerName}</p>
        )}
      </td>
      <td className="px-4 py-3 font-semibold text-gray-800">
        ${Number(order.priceUsdSnapshot).toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
              aria-label={`Accept order ${order.id}`}
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
              aria-label={`Reject order ${order.id}`}
            >
              Reject
            </button>
          </div>
        )}
        {order.status === 'rejected' && order.rejectionReason && (
          <p className="text-xs text-gray-500 max-w-xs truncate" title={order.rejectionReason}>
            {order.rejectionReason}
          </p>
        )}
      </td>
    </tr>
  );
}

function Modal({ title, children, onClose }: {
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
