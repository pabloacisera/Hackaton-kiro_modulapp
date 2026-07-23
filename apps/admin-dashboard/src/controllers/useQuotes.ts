import { useState, useCallback, useEffect } from 'react';
import {
  fetchQuotes,
  presentQuote,
  archiveQuote,
  QuoteDto,
  QuoteStatus,
  PaginatedQuotes,
} from '../models/quotesApi';

export interface UseQuotesResult {
  quotes: QuoteDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  statusFilter: QuoteStatus | undefined;
  setStatusFilter: (s: QuoteStatus | undefined) => void;
  setPage: (p: number) => void;
  present: (
    quoteId: string,
    priceUsd: number,
    leadTimeDays: number,
    estimatedDeliveryDate: string,
  ) => Promise<void>;
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
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchQuotes({ status: statusFilter, page })
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
  }, [page, statusFilter, reloadToken]);

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
    statusFilter,
    setStatusFilter,
    setPage,
    present,
    archive,
    reload,
  };
}
