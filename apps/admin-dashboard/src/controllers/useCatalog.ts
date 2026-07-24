import { useState, useCallback, useEffect } from 'react';
import {
  fetchAdminPrototypes,
  createPrototype,
  updatePrototype,
  deactivatePrototype,
  reactivatePrototype,
  AdminPrototypeDto,
  PaginatedAdminPrototypes,
  CreatePrototypePayload,
  UpdatePrototypePayload,
} from '../models/catalogApi';

export interface UseCatalogResult {
  prototypes: AdminPrototypeDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
  setPage: (p: number) => void;
  create: (data: CreatePrototypePayload) => Promise<void>;
  update: (id: string, data: UpdatePrototypePayload) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
  reload: () => void;
}

/**
 * TASK-admincatalog-2: useCatalog controller — fetches, creates, updates,
 * deactivates/reactivates prototypes for the admin catalog page.
 */
export function useCatalog(): UseCatalogResult {
  const [prototypes, setPrototypes] = useState<AdminPrototypeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAdminPrototypes({
      q: search || undefined,
      category: category || undefined,
      page,
    })
      .then((data: PaginatedAdminPrototypes) => {
        if (cancelled) return;
        setPrototypes(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load prototypes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, category, reloadToken]);

  const create = useCallback(
    async (data: CreatePrototypePayload) => {
      await createPrototype(data);
      reload();
    },
    [reload],
  );

  const update = useCallback(
    async (id: string, data: UpdatePrototypePayload) => {
      await updatePrototype(id, data);
      reload();
    },
    [reload],
  );

  const deactivate = useCallback(
    async (id: string) => {
      await deactivatePrototype(id);
      reload();
    },
    [reload],
  );

  const reactivate = useCallback(
    async (id: string) => {
      await reactivatePrototype(id);
      reload();
    },
    [reload],
  );

  return {
    prototypes,
    total,
    page,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    setPage,
    create,
    update,
    deactivate,
    reactivate,
    reload,
  };
}
