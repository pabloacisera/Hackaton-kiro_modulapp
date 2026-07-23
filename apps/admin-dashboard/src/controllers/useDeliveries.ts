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
  loading: boolean;
  error: string | null;
  statusFilter: DeliveryStatus | undefined;
  setStatusFilter: (s: DeliveryStatus | undefined) => void;
  deliver: (origin: 'order' | 'quote', id: string) => Promise<void>;
  postpone: (origin: 'order' | 'quote', id: string, newDate: string) => Promise<void>;
  reload: () => void;
}

export function useDeliveries(): UseDeliveriesResult {
  const [deliveries, setDeliveries] = useState<DeliveryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDeliveries({ status: statusFilter })
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
  }, [statusFilter, reloadToken]);

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
    loading,
    error,
    statusFilter,
    setStatusFilter,
    deliver,
    postpone,
    reload,
  };
}
