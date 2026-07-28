import { FormEvent, useState } from 'react';
import { createOrder } from '../models/ordersApi';
import { PrototypeDto } from '../models/catalogApi';

interface Props {
  prototype: PrototypeDto;
  onSuccess: (orderId: string, paymentLink: string) => void;
  onCancel: () => void;
}

/**
 * TASK-directpurchase-12: Checkout form — collects customer email and
 * initiates payment through the API. Redirects to PayPal on success.
 */
export function CheckoutForm({ prototype, onSuccess, onCancel }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createOrder({
        prototypeId: prototype.id,
        customerEmail: email,
        customerName: name || undefined,
      });
      onSuccess(result.orderId, result.paymentLink);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Algo salió mal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Completar tu compra</h2>

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="font-medium text-gray-800">{prototype.name}</p>
        <p className="text-lg font-bold text-blue-600">${prototype.priceUsd.toFixed(2)} USD</p>
        <p className="text-xs text-gray-500 mt-1">
          No necesitas cuenta — ingresa tu email para recibir el comprobante.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="checkout-name" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre completo (opcional)
          </label>
          <input
            id="checkout-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="checkout-email" className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
            aria-required="true"
          />
          <p className="mt-1 text-xs text-gray-500">
            La confirmación de pago y el comprobante se enviarán a este correo.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? 'Procesando…' : 'Pagar con PayPal'}
          </button>
        </div>
      </form>
    </div>
  );
}
