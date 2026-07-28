import { useState } from 'react';
import type { ComplaintDto } from '../../models/complaintsApi';

interface ResolveModalProps {
  complaint: ComplaintDto;
  open: boolean;
  onClose: () => void;
  onResolve: (id: string, message: string) => Promise<void>;
}

export function ResolveModal({ complaint, open, onClose, onResolve }: ResolveModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onResolve(complaint.id, message.trim());
      setMessage('');
      onClose();
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-xl bg-white shadow-elevated"
          role="dialog"
          aria-modal="true"
          aria-label="Resolver reclamo"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Resolver reclamo</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="text-sm font-medium text-gray-900">
                {complaint.customerName} ({complaint.customerEmail})
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Motivo</p>
              <p className="text-sm text-gray-700">{complaint.reason}</p>
            </div>
            <div>
              <label htmlFor="resolve-message" className="block text-sm font-medium text-gray-700">
                Mensaje de resolución
              </label>
              <p className="mb-2 text-xs text-gray-400">
                Este mensaje se enviará por correo electrónico al cliente.
              </p>
              <textarea
                id="resolve-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Escribe el mensaje que se enviará al cliente..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
