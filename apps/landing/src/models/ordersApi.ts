/**
 * TASK-directpurchase-12: Orders API model for landing (customer-facing).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface CreateOrderResponse {
  orderId: string;
  paymentLink: string;
}

export async function createOrder(payload: {
  prototypeId: string;
  customerEmail: string;
  customerName?: string;
}): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error((err as { message?: string }).message ?? 'Failed to create order'),
      { status: res.status },
    );
  }
  return res.json();
}
