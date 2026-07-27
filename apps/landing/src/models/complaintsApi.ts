const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface CreateComplaintRequest {
  referenceType: 'order' | 'quote' | 'unknown';
  referenceId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reason: string;
}

export interface CreateComplaintResponse {
  status: string;
  message: string;
  complaintId: string;
}

export async function createComplaint(
  payload: CreateComplaintRequest,
): Promise<CreateComplaintResponse> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to submit complaint');
  }
  return res.json();
}
