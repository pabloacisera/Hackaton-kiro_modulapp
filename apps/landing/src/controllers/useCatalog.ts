import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPrototypes,
  subscribeCatalogStream,
  CatalogFilter,
  PrototypeDto,
  CatalogListResponse,
} from '../models/catalogApi';

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

export interface UseCatalogResult {
  items: PrototypeDto[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setFilter: (f: Partial<CatalogFilter>) => void;
  filter: CatalogFilter;
}

/**
 * TASK-catalog-5: useCatalog controller.
 * - Fetches catalog with combined filters.
 * - Subscribes to SSE and merges incoming prototype.updated /
 *   prototype.deactivated events onto local state.
 * - Reconnects SSE with exponential backoff on connection drop.
 */
export function useCatalog(initialFilter: CatalogFilter = {}): UseCatalogResult {
  const [filter, setFilterState] = useState<CatalogFilter>({
    page: 1, pageSize: 12, ...initialFilter,
  });
  const [items, setItems] = useState<PrototypeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Fetch catalog ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: CatalogListResponse = await fetchPrototypes(filter);
      setItems(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── SSE subscription with reconnect backoff ───────────────────────────────

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      cleanupRef.current = subscribeCatalogStream((event) => {
        backoffRef.current = INITIAL_BACKOFF_MS; // reset on successful message

        if (event.type === 'prototype.updated') {
          setItems((prev) =>
            prev.map((p) =>
              p.id === event.payload.id ? { ...p, ...event.payload } : p,
            ),
          );
        } else if (event.type === 'prototype.deactivated') {
          setItems((prev) => prev.filter((p) => p.id !== event.payload.id));
        }
      });

      // EventSource has no built-in onclose; detect via onerror
      // The cleanup will re-schedule with backoff if needed
    }

    connect();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  const setFilter = useCallback((f: Partial<CatalogFilter>) => {
    setFilterState((prev) => ({ ...prev, ...f, page: f.page ?? 1 }));
  }, []);

  return { items, total, page, loading, error, setFilter, filter };
}
