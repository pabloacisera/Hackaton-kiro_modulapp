import { FormEvent, useState } from 'react';
import { createQuoteRequest } from '../models/quotesApi';

interface Props {
  onSuccess: (quoteId: string) => void;
  onCancel: () => void;
}

/**
 * TASK-quoteB-17: Landing UI — quote request form.
 * Collects: name, email, phone (all mandatory), description, needed-by date.
 * Client-side validates mandatory fields; real validation is server-side.
 */
export function QuoteRequestForm({ onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim() !== '' && email.includes('@') && phone.trim() !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createQuoteRequest({
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        description: description.trim(),
        neededByDate: neededByDate || new Date().toISOString().split('T')[0],
      });

      if (result.status === 'discarded') {
        setError(result.message);
      } else {
        onSuccess(result.quoteId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Request a Custom Quote</h2>
      <p className="mb-6 text-sm text-gray-600">
        Tell us what you need — we&apos;ll get back to you with a price and timeline.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="quote-name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="María García"
          />
        </div>

        <div>
          <label htmlFor="quote-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="quote-phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+54 11 5555-1234"
          />
        </div>

        <div>
          <label
            htmlFor="quote-description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            What do you need?
          </label>
          <textarea
            id="quote-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what you're looking for: dimensions, theme, materials..."
          />
        </div>

        <div>
          <label htmlFor="quote-date" className="mb-1 block text-sm font-medium text-gray-700">
            When do you need it by?
          </label>
          <input
            id="quote-date"
            type="date"
            value={neededByDate}
            onChange={(e) => setNeededByDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
