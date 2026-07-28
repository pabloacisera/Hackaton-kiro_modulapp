import { useState, useCallback, useEffect } from 'react';
import {
  fetchOrders,
  acceptOrder,
  rejectOrder,
  OrderDto,
  OrderStatus,
  PaginatedOrders,
} from '../models/ordersApi';
import type { AdminNotification } from './useNotifications';

const ORDER_NOTIF_TYPES = ['new_purchase', 'payment_confirmed'];

export interface UseOrdersResult {
  orders: OrderDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: OrderStatus | undefined;
  setStatusFilter: (s: OrderStatus | undefined) => void;
  setPage: (p: number) => void;
  accept: (orderId: string, eta: string) => Promise<void>;
  reject: (orderId: string, reason: string) => Promise<void>;
  reload: () => void;
}

export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const handler = (e: CustomEvent<AdminNotification>) => {
      if (ORDER_NOTIF_TYPES.includes(e.detail.type)) reload();
    };
    window.addEventListener('notification.new', handler as EventListener);
    return () => window.removeEventListener('notification.new', handler as EventListener);
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOrders({ status: statusFilter, q: search || undefined, page })
      .then((data: PaginatedOrders) => {
        if (cancelled) return;
        setOrders(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, search, reloadToken]);

  const accept = useCallback(
    async (orderId: string, eta: string) => {
      await acceptOrder(orderId, eta);
      reload();
    },
    [reload],
  );

  const reject = useCallback(
    async (orderId: string, reason: string) => {
      await rejectOrder(orderId, reason);
      reload();
    },
    [reload],
  );

  return {
    orders,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    accept,
    reject,
    reload,
  };
}
