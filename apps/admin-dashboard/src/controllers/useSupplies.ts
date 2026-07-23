import { useState, useCallback, useEffect } from 'react';
import {
  fetchSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  SupplyDto,
  PaginatedSupplies,
} from '../models/suppliesApi';

export interface UseSuppliesResult {
  supplies: SupplyDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  belowMinOnly: boolean;
  setBelowMinOnly: (b: boolean) => void;
  setPage: (p: number) => void;
  create: (data: Parameters<typeof createSupply>[0]) => Promise<void>;
  update: (id: string, data: Parameters<typeof updateSupply>[1]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => void;
}

/**
 * TASK-stock-8: useSupplies controller — fetches, creates, updates, deletes supplies.
 */
export function useSupplies(): UseSuppliesResult {
  const [supplies, setSupplies] = useState<SupplyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [belowMinOnly, setBelowMinOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSupplies({ search: search || undefined, belowMin: belowMinOnly || undefined, page })
      .then((data: PaginatedSupplies) => {
        if (cancelled) return;
        setSupplies(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load supplies');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, belowMinOnly, reloadToken]);

  const create = useCallback(
    async (data: Parameters<typeof createSupply>[0]) => {
      await createSupply(data);
      reload();
    },
    [reload],
  );

  const update = useCallback(
    async (id: string, data: Parameters<typeof updateSupply>[1]) => {
      await updateSupply(id, data);
      reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSupply(id);
      reload();
    },
    [reload],
  );

  return {
    supplies,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    belowMinOnly,
    setBelowMinOnly,
    setPage,
    create,
    update,
    remove,
    reload,
  };
}
