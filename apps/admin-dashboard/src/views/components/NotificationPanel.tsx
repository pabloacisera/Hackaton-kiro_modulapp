import { Link } from 'react-router-dom';
import { AdminNotification } from '../../controllers/useNotifications';

interface Props {
  notifications: AdminNotification[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

/**
 * TASK-notif-8: NotificationPanel — dropdown with notification history.
 */
export function NotificationPanel({
  notifications,
  soundEnabled,
  onToggleSound,
  onMarkRead,
  onClose,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Panel de notificaciones"
        className="absolute right-0 top-10 z-40 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Notificaciones</h2>
          <button
            onClick={onToggleSound}
            className="text-xs text-gray-500 hover:text-gray-700"
            aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? '🔔 Sonido on' : '🔕 Sonido off'}
          </button>
        </div>

        {/* List */}
        <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">Sin notificaciones</li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition ${
                  n.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    to={n.referenceUrl.replace(/^\/admin/, '')}
                    className="block text-sm font-medium text-gray-900 hover:underline truncate"
                    onClick={() => {
                      if (!n.read) onMarkRead(n.id);
                      onClose();
                    }}
                  >
                    {n.message}
                  </Link>
                  <time className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </time>
                </div>
                {!n.read && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="shrink-0 text-xs text-blue-600 hover:underline"
                    aria-label={`Marcar "${n.message}" como leída`}
                  >
                    Marcar leída
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
