import { useState, useEffect, useCallback } from 'react';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import { fetchQuotes, QuoteDto, PaginatedQuotes } from '../models/quotesApi';

/**
 * ArchivedQuotesPage — shows only archived quotes with search + pagination.
 * Accessible from Settings or nav.
 */
export function ArchivedQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchQuotes({ status: 'archived', q: search || undefined, page })
      .then((data: PaginatedQuotes) => {
        if (cancelled) return;
        setQuotes(data.items);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar archivadas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, reloadToken]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones Archivadas</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <TableSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por nombre, email..."
        />
        <button
          onClick={reload}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : quotes.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="text-3xl mb-2">📂</p>
          <p>No hay cotizaciones archivadas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Cotizaciones archivadas">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Creada</th>
                <th className="px-3 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{q.customerName}</td>
                  <td className="px-3 py-2 text-gray-500">{q.customerEmail}</td>
                  <td className="px-3 py-2">
                    {q.quotedPriceUsd ? `$${q.quotedPriceUsd.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{formatDate(q.createdAt)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                    {q.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
