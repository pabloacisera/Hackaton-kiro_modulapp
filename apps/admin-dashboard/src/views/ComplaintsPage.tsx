import { useComplaints } from '../controllers/useComplaints';
import type { ComplaintStatus } from '../models/complaintsApi';

const STATUS_OPTIONS: { value: ComplaintStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'refund_approved', label: 'Refund Approved' },
  { value: 'resolved_other_way', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * TASK-complaint-9: Admin complaints table with actions.
 */
export function ComplaintsPage() {
  const {
    complaints,
    total,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    review,
    refund,
    resolve,
    reload,
  } = useComplaints();

  const canReview = (status: ComplaintStatus) => status === 'received';
  const canRefund = (status: ComplaintStatus) => status === 'under_review';
  const canResolve = (status: ComplaintStatus) => status === 'under_review';

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <select
          value={statusFilter ?? ''}
          onChange={(e) =>
            setStatusFilter(e.target.value ? (e.target.value as ComplaintStatus) : undefined)
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label="Filter by status"
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
          Refresh
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
        <p className="text-gray-500">Loading...</p>
      ) : complaints.length === 0 ? (
        <p className="text-gray-500">No complaints found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Complaints table">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Actions</th>
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
                          onClick={() => review(c.id)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          Review
                        </button>
                      )}
                      {canRefund(c.status) && (
                        <button
                          onClick={() => refund(c.id)}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          Approve Refund
                        </button>
                      )}
                      {canResolve(c.status) && (
                        <button
                          onClick={() =>
                            resolve(c.id, 'Resolved via admin action', 'resolved_other_way')
                          }
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                        >
                          Resolve
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
    </div>
  );
}
