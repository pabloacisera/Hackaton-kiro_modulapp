import { FormEvent, useState } from 'react';
import { createComplaint } from '../models/complaintsApi';

interface Props {
  onSuccess: (complaintId: string) => void;
}

/**
 * TASK-complaint-8: Landing UI — complaint/refund form.
 * Always visible section. Collects: reference type, reference ID (optional),
 * name, email, phone (optional), reason.
 */
export function ComplaintForm({ onSuccess }: Props) {
  const [referenceType, setReferenceType] = useState<'order' | 'quote' | 'unknown'>('order');
  const [referenceId, setReferenceId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim() !== '' && email.includes('@') && reason.trim() !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createComplaint({
        referenceType,
        referenceId: referenceId.trim() || undefined,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined,
        reason: reason.trim(),
      });
      onSuccess(result.complaintId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Complaints & Refunds</h2>
      <p className="mb-6 text-sm text-gray-600">
        Have an issue with your order? Submit a complaint and we&apos;ll get back to you.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="complaint-ref-type"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reference type
          </label>
          <select
            id="complaint-ref-type"
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value as 'order' | 'quote' | 'unknown')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="order">Order</option>
            <option value="quote">Quote</option>
            <option value="unknown">I don&apos;t have my reference</option>
          </select>
        </div>

        {referenceType !== 'unknown' && (
          <div>
            <label
              htmlFor="complaint-ref-id"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Order/Quote ID (optional)
            </label>
            <input
              id="complaint-ref-id"
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. ord-abc123..."
            />
          </div>
        )}

        <div>
          <label htmlFor="complaint-name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="complaint-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="complaint-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="complaint-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="complaint-phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            id="complaint-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="complaint-reason"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="complaint-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            aria-required="true"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe the issue..."
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isValid}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          aria-busy={loading}
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
