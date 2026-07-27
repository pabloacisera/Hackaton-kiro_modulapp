/**
 * TASK-quoteB-17: Quotes API model for landing (customer-facing).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface CreateQuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  neededByDate: string; // ISO date
}

export interface CreateQuoteResponse {
  status: 'pending' | 'discarded';
  message: string;
  quoteId: string;
}

export interface QuoteActionResponse {
  status: string;
  message: string;
  paymentUrl?: string;
  quoteId?: string;
}

export async function createQuoteRequest(
  payload: CreateQuoteRequest,
): Promise<CreateQuoteResponse> {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error((err as { message?: string }).message ?? 'Failed to submit quote request'),
      { status: res.status },
    );
  }
  return res.json();
}

export async function fetchQuoteAction(
  quoteId: string,
  action: 'accept' | 'reject',
  token: string,
): Promise<QuoteActionResponse> {
  const res = await fetch(
    `${API_BASE}/quotes/${quoteId}/${action}?token=${encodeURIComponent(token)}`,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error((err as { message?: string }).message ?? `Failed to ${action} quote`),
      { status: res.status },
    );
  }
  return res.json();
}
