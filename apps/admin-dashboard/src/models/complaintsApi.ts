import { httpClient } from './http-client';

export type ComplaintStatus =
  'received' | 'under_review' | 'refund_approved' | 'resolved_other_way' | 'rejected';

export interface ComplaintDto {
  id: string;
  referenceType: 'order' | 'quote' | 'unknown';
  referenceId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  reason: string;
  status: ComplaintStatus;
  resolutionNotes: string | null;
  refundRequestId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PaginatedComplaints {
  items: ComplaintDto[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchComplaints(params?: {
  status?: ComplaintStatus;
  q?: string;
  page?: number;
}): Promise<PaginatedComplaints> {
  const res = await httpClient.get<PaginatedComplaints>('/complaints', { params });
  return res.data;
}

export async function reviewComplaint(id: string): Promise<void> {
  await httpClient.patch(`/complaints/${id}/review`);
}

export async function approveRefund(id: string): Promise<void> {
  await httpClient.patch(`/complaints/${id}/approve-refund`);
}

export async function resolveComplaint(
  id: string,
  resolutionNotes: string,
  status: 'resolved_other_way' | 'rejected',
): Promise<void> {
  await httpClient.patch(`/complaints/${id}/resolve`, { resolutionNotes, status });
}
