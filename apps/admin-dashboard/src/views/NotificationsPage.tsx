import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TableSearch } from './components/TableSearch';
import { Pagination } from './components/Pagination';
import { useNotifications } from '../controllers/useNotifications';
import { useAuth } from '../controllers/useAuth';

/**
 * Converts a notification referenceUrl into a valid React Router path.
 * Strips the /admin prefix (handled by basename) and normalizes
 * legacy /quotes/<id> paths into /quotes?q=<id>.
 */
function toRoute(referenceUrl: string): string {
  const path = referenceUrl.replace(/^\/admin/, '');
  const legacyMatch = path.match(/^\/(quotes|orders|complaints)\/([a-f0-9-]{36})$/);
  if (legacyMatch) {
    return `/${legacyMatch[1]}?q=${legacyMatch[2]}`;
  }
  return path;
}

/**
 * NotificationsPage — standalone page listing all admin notifications
 * with search and pagination.
 */
export function NotificationsPage() {
  const { accessToken } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications(accessToken);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Client-side filtering (notifications are already loaded via WebSocket)
  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.message.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeLabels: Record<string, string> = {
    new_order: '🛒 Nueva orden',
    new_quote_request: '📝 Nueva cotización',
    new_complaint: '⚠️ Nuevo reclamo',
    low_stock: '📦 Stock bajo',
    payment_confirmed: '💳 Pago confirmado',
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <span className="text-sm text-gray-500">
          {unreadCount} sin leer / {notifications.length} total
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <TableSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por mensaje o tipo..."
        />
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="text-3xl mb-2">🔔</p>
          <p>No hay notificaciones aún.</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          Sin resultados para &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 transition ${
                n.read ? 'border-gray-100 bg-white' : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {typeLabels[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" title="Sin leer" />
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{n.message}</p>
                  {n.referenceUrl && (
                    <Link
                      to={toRoute(n.referenceUrl)}
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Ver detalle →
                    </Link>
                  )}
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
