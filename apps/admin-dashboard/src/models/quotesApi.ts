import { httpClient } from './http-client';

export type QuoteStatus =
  | 'discarded_incomplete_data'
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'payment_initiated'
  | 'paid'
  | 'payment_expired'
  | 'archived';

export interface QuoteDto {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  neededByDate: string;
  status: QuoteStatus;
  quotedPriceUsd: number | null;
  quotedLeadTimeDays: number | null;
  estimatedDeliveryDate: string | null;
  quoteSentAt: string | null;
  quoteResponseDeadline: string | null;
  paymentDeadline: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedQuotes {
  items: QuoteDto[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchQuotes(params?: {
  status?: QuoteStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedQuotes> {
  const res = await httpClient.get<PaginatedQuotes>('/quotes', { params });
  return res.data;
}

export async function presentQuote(
  quoteId: string,
  data: { priceUsd: number; leadTimeDays: number; estimatedDeliveryDate: string },
): Promise<void> {
  await httpClient.patch(`/quotes/${quoteId}/present`, data);
}

export async function archiveQuote(quoteId: string): Promise<void> {
  await httpClient.patch(`/quotes/${quoteId}/archive`);
}

export async function adminRejectQuote(quoteId: string, reason: string): Promise<void> {
  await httpClient.patch(`/quotes/${quoteId}/admin-reject`, { reason });
}
