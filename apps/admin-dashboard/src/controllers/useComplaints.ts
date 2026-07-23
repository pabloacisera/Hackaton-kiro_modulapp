import { useState, useCallback, useEffect } from 'react';
import {
  fetchComplaints,
  reviewComplaint,
  approveRefund,
  resolveComplaint,
  ComplaintDto,
  ComplaintStatus,
  PaginatedComplaints,
} from '../models/complaintsApi';

export interface UseComplaintsResult {
  complaints: ComplaintDto[];
  total: number;
  loading: boolean;
  error: string | null;
  statusFilter: ComplaintStatus | undefined;
  setStatusFilter: (s: ComplaintStatus | undefined) => void;
  review: (id: string) => Promise<void>;
  refund: (id: string) => Promise<void>;
  resolve: (id: string, notes: string, status: 'resolved_other_way' | 'rejected') => Promise<void>;
  reload: () => void;
}

export function useComplaints(): UseComplaintsResult {
  const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchComplaints({ status: statusFilter })
      .then((data: PaginatedComplaints) => {
        if (cancelled) return;
        setComplaints(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load complaints');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, reloadToken]);

  const review = useCallback(
    async (id: string) => {
      await reviewComplaint(id);
      reload();
    },
    [reload],
  );
  const refund = useCallback(
    async (id: string) => {
      await approveRefund(id);
      reload();
    },
    [reload],
  );
  const resolve = useCallback(
    async (id: string, notes: string, status: 'resolved_other_way' | 'rejected') => {
      await resolveComplaint(id, notes, status);
      reload();
    },
    [reload],
  );

  return {
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
  };
}
