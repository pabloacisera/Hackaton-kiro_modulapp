import { useState } from 'react';
import { useQuotes } from '../controllers/useQuotes';
import type { QuoteDto, QuoteStatus } from '../models/quotesApi';

const STATUS_OPTIONS: { value: QuoteStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'payment_initiated', label: 'Payment Initiated' },
  { value: 'paid', label: 'Paid' },
  { value: 'payment_expired', label: 'Payment Expired' },
  { value: 'archived', label: 'Archived' },
];

/**
 * TASK-quoteB-19: Admin UI — quotes management page with quoting form.
 */
export function QuotesPage() {
  const { quotes, total, loading, error, statusFilter, setStatusFilter, present, archive, reload } =
    useQuotes();
  const [presentModal, setPresentModal] = useState<QuoteDto | null>(null);
  const [priceUsd, setPriceUsd] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePresent = async () => {
    if (!presentModal) return;
    const price = parseFloat(priceUsd);
    const days = parseInt(leadTimeDays, 10);
    if (isNaN(price) || price <= 0 || isNaN(days) || days <= 0 || !estimatedDeliveryDate) {
      setActionError('Please fill in all fields with valid values.');
      return;
    }
    try {
      await present(presentModal.id, price, days, estimatedDeliveryDate);
      setPresentModal(null);
      setPriceUsd('');
      setLeadTimeDays('');
      setEstimatedDeliveryDate('');
      setActionError(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to present quote');
    }
  };

  const handleArchive = async (quoteId: string) => {
    try {
      await archive(quoteId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to archive');
    }
  };

  const canPresent = (q: QuoteDto) => q.status === 'pending';
  const canArchive = (q: QuoteDto) =>
    q.status === 'rejected' || q.status === 'expired' || q.status === 'payment_expired';

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="quote-status-filter" className="text-sm font-medium text-gray-700">
          Status:
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
        <p className="text-gray-500">Loading quotes...</p>
      ) : quotes.length === 0 ? (
        <p className="text-gray-500">No quotes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Quotes table">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Needed By</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
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
                      {canPresent(q) && (
                        <button
                          onClick={() => setPresentModal(q)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Present Quote
                        </button>
                      )}
                      {canArchive(q) && (
                        <button
                          onClick={() => handleArchive(q.id)}
                          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Archive
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

      {/* Present Quote Modal */}
      {presentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Present Quote</h2>
            <p className="mb-1 text-sm text-gray-600">
              Customer: <strong>{presentModal.customerName}</strong> ({presentModal.customerEmail})
            </p>
            <p className="mb-4 text-sm text-gray-600">Request: {presentModal.description}</p>

            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="present-price"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Price (USD) <span className="text-red-500">*</span>
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
                  Lead time (days) <span className="text-red-500">*</span>
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
                  Estimated delivery date <span className="text-red-500">*</span>
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
                  Cancel
                </button>
                <button
                  onClick={handlePresent}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Send Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
