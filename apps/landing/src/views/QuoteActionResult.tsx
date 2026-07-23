import { useEffect, useState } from 'react';
import { fetchQuoteAction, QuoteActionResponse } from '../models/quotesApi';

interface Props {
  quoteId: string;
  action: 'accept' | 'reject';
  token: string;
}

/**
 * TASK-quoteB-18: Public accept/reject result pages.
 * Shows: success, expired link, already processed, or error.
 * No account required — works via magic link token.
 */
export function QuoteActionResult({ quoteId, action, token }: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QuoteActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function execute() {
      try {
        const res = await fetchQuoteAction(quoteId, action, token);
        if (!cancelled) setResult(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    execute();
    return () => {
      cancelled = true;
    };
  }, [quoteId, action, token]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <p className="text-gray-500">Processing your response...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">❌</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Something went wrong</h1>
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!result) return null;

  // Expired link
  if (result.status === 'expired') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">⏰</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Link Expired</h1>
        <p className="text-sm text-gray-600">{result.message}</p>
        <p className="mt-4 text-xs text-gray-400">Please contact us to request a new quote.</p>
      </div>
    );
  }

  // Already processed (double-click or re-send)
  if (
    result.status !== 'accepted' &&
    result.status !== 'rejected' &&
    result.message?.includes('already')
  ) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">ℹ️</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Already Processed</h1>
        <p className="text-sm text-gray-600">{result.message}</p>
        <p className="mt-2 text-xs text-gray-400">
          Current status: <strong>{result.status}</strong>
        </p>
      </div>
    );
  }

  // Accepted — show payment link
  if (result.status === 'accepted' && result.paymentUrl) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Quote Accepted!</h1>
        <p className="mb-6 text-sm text-gray-600">{result.message}</p>
        <a
          href={result.paymentUrl}
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          rel="noopener noreferrer"
        >
          Complete Payment
        </a>
        <p className="mt-4 text-xs text-gray-400">Payment link expires in 24 hours.</p>
      </div>
    );
  }

  // Rejected — confirmation
  if (result.status === 'rejected') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">👋</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Quote Rejected</h1>
        <p className="text-sm text-gray-600">{result.message}</p>
        <p className="mt-4 text-xs text-gray-400">Feel free to submit a new request anytime.</p>
      </div>
    );
  }

  // Generic success
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-4 text-4xl">✅</div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Done</h1>
      <p className="text-sm text-gray-600">{result.message}</p>
    </div>
  );
}
