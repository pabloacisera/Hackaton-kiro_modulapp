import { useState, useCallback, useEffect } from 'react';
import {
  fetchQuotes,
  presentQuote,
  archiveQuote,
  adminRejectQuote,
  QuoteDto,
  QuoteStatus,
  PaginatedQuotes,
} from '../models/quotesApi';
import type { AdminNotification } from './useNotifications';

const QUOTE_NOTIF_TYPES = ['new_quote_request', 'quote_response'];

export interface UseQuotesResult {
  quotes: QuoteDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: QuoteStatus | undefined;
  setStatusFilter: (s: QuoteStatus | undefined) => void;
  setPage: (p: number) => void;
  present: (
    quoteId: string,
    priceUsd: number,
    leadTimeDays: number,
    estimatedDeliveryDate: string,
  ) => Promise<void>;
  adminReject: (quoteId: string, reason: string) => Promise<void>;
  archive: (quoteId: string) => Promise<void>;
  reload: () => void;
}

/**
 * TASK-quoteB-19: useQuotes controller — fetches quotes, provides
 * present (admin quotes) and archive actions.
 */
export function useQuotes(): UseQuotesResult {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const handler = (e: CustomEvent<AdminNotification>) => {
      if (QUOTE_NOTIF_TYPES.includes(e.detail.type)) reload();
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

    fetchQuotes({ status: statusFilter, q: search || undefined, page })
      .then((data: PaginatedQuotes) => {
        if (cancelled) return;
        setQuotes(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load quotes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, search, reloadToken]);

  const present = useCallback(
    async (
      quoteId: string,
      priceUsd: number,
      leadTimeDays: number,
      estimatedDeliveryDate: string,
    ) => {
      await presentQuote(quoteId, { priceUsd, leadTimeDays, estimatedDeliveryDate });
      reload();
    },
    [reload],
  );

  const adminReject = useCallback(
    async (quoteId: string, reason: string) => {
      await adminRejectQuote(quoteId, reason);
      reload();
    },
    [reload],
  );

  const archive = useCallback(
    async (quoteId: string) => {
      await archiveQuote(quoteId);
      reload();
    },
    [reload],
  );

  return {
    quotes,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    present,
    adminReject,
    archive,
    reload,
  };
}
