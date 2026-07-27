import { useState, useCallback, useEffect } from 'react';
import {
  fetchDeliveries,
  markDelivered,
  postponeDelivery,
  DeliveryDto,
  DeliveryStatus,
  PaginatedDeliveries,
} from '../models/deliveriesApi';

export interface UseDeliveriesResult {
  deliveries: DeliveryDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: DeliveryStatus | undefined;
  setStatusFilter: (s: DeliveryStatus | undefined) => void;
  setPage: (p: number) => void;
  deliver: (origin: 'order' | 'quote', id: string) => Promise<void>;
  postpone: (origin: 'order' | 'quote', id: string, newDate: string) => Promise<void>;
  reload: () => void;
}

export function useDeliveries(): UseDeliveriesResult {
  const [deliveries, setDeliveries] = useState<DeliveryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDeliveries({ status: statusFilter, q: search || undefined, page })
      .then((data: PaginatedDeliveries) => {
        if (cancelled) return;
        setDeliveries(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load deliveries');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, search, page, reloadToken]);

  const deliver = useCallback(
    async (origin: 'order' | 'quote', id: string) => {
      await markDelivered(origin, id);
      reload();
    },
    [reload],
  );

  const postpone = useCallback(
    async (origin: 'order' | 'quote', id: string, newDate: string) => {
      await postponeDelivery(origin, id, newDate);
      reload();
    },
    [reload],
  );

  return {
    deliveries,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    deliver,
    postpone,
    reload,
  };
}
