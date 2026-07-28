import { useState } from 'react';
import type { ComplaintDto } from '../../models/complaintsApi';

interface ReviewModalProps {
  complaint: ComplaintDto;
  open: boolean;
  onClose: () => void;
  onReview: (id: string) => Promise<void>;
  onRefund: (id: string) => Promise<void>;
  onOpenResolve: (c: ComplaintDto) => void;
}

export function ReviewModal({
  complaint,
  open,
  onClose,
  onReview,
  onRefund,
  onOpenResolve,
}: ReviewModalProps) {
  const [step, setStep] = useState<'details' | 'actions'>('details');
  const [actionLoading, setActionLoading] = useState(false);

  if (!open) return null;

  const handleContinue = async () => {
    setActionLoading(true);
    try {
      await onReview(complaint.id);
      setStep('actions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    setActionLoading(true);
    try {
      await onRefund(complaint.id);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = () => {
    onOpenResolve(complaint);
    onClose();
  };

  const handleClose = () => {
    setStep('details');
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
          aria-label="Revisar reclamo"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Revisar reclamo</h2>
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
              <p className="text-sm font-medium text-gray-900">{complaint.customerName}</p>
              <p className="text-xs text-gray-500">{complaint.customerEmail}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Referencia</p>
              <p className="text-sm font-mono text-gray-900">
                {complaint.referenceType}/{complaint.referenceId ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Motivo de la queja</p>
              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">
                  {complaint.reason}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
            {step === 'details' && (
              <button
                onClick={handleContinue}
                disabled={actionLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Procesando...' : 'Continuar revisión'}
              </button>
            )}
            {step === 'actions' && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRefund}
                  disabled={actionLoading}
                  className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Procesando...' : 'Aprobar reembolso'}
                </button>
                <button
                  onClick={handleResolve}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Resolver
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
