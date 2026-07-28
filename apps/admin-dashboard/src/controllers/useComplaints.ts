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
import type { AdminNotification } from './useNotifications';

const COMPLAINT_NOTIF_TYPES = ['new_complaint'];

export interface UseComplaintsResult {
  complaints: ComplaintDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: ComplaintStatus | undefined;
  setStatusFilter: (s: ComplaintStatus | undefined) => void;
  setPage: (p: number) => void;
  review: (id: string) => Promise<void>;
  refund: (id: string) => Promise<void>;
  resolve: (id: string, notes: string, status: 'resolved_other_way' | 'rejected') => Promise<void>;
  reviewModalComplaint: ComplaintDto | null;
  openReviewModal: (c: ComplaintDto) => void;
  closeReviewModal: () => void;
  resolveModalComplaint: ComplaintDto | null;
  openResolveModal: (c: ComplaintDto) => void;
  closeResolveModal: () => void;
  reload: () => void;
}

export function useComplaints(): UseComplaintsResult {
  const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [reviewModalComplaint, setReviewModalComplaint] = useState<ComplaintDto | null>(null);
  const [resolveModalComplaint, setResolveModalComplaint] = useState<ComplaintDto | null>(null);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const handler = (e: CustomEvent<AdminNotification>) => {
      if (COMPLAINT_NOTIF_TYPES.includes(e.detail.type)) reload();
    };
    window.addEventListener('notification.new', handler as EventListener);
    return () => window.removeEventListener('notification.new', handler as EventListener);
  }, [reload]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchComplaints({ status: statusFilter, q: search || undefined, page })
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
  }, [statusFilter, search, page, reloadToken]);

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

  const openReviewModal = useCallback((c: ComplaintDto) => {
    setReviewModalComplaint(c);
  }, []);

  const closeReviewModal = useCallback(() => {
    setReviewModalComplaint(null);
  }, []);

  const openResolveModal = useCallback((c: ComplaintDto) => {
    setResolveModalComplaint(c);
  }, []);

  const closeResolveModal = useCallback(() => {
    setResolveModalComplaint(null);
  }, []);

  return {
    complaints,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    review,
    refund,
    resolve,
    reviewModalComplaint,
    openReviewModal,
    closeReviewModal,
    resolveModalComplaint,
    openResolveModal,
    closeResolveModal,
    reload,
  };
}
