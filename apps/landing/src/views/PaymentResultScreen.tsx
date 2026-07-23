/**
 * TASK-directpurchase-12: Payment result screens.
 * Shown after returning from PayPal (success or cancel).
 */

interface SuccessProps {
  orderId: string;
  customerEmail: string;
  onBackToCatalog: () => void;
}

export function PaymentSuccessScreen({ orderId, customerEmail, onBackToCatalog }: SuccessProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center" role="main">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 text-3xl">
          ✓
        </div>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Payment received!</h1>
      <p className="mb-2 text-gray-600">
        Your order <strong>#{orderId.slice(0, 8).toUpperCase()}</strong> is pending admin approval.
      </p>
      <p className="mb-8 text-sm text-gray-500">
        A confirmation has been sent to <strong>{customerEmail}</strong>.
        You will be notified once the admin accepts or rejects your order.
      </p>
      <button
        onClick={onBackToCatalog}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Back to catalog
      </button>
    </div>
  );
}

interface CancelProps {
  onRetry: () => void;
  onBackToCatalog: () => void;
}

export function PaymentCancelledScreen({ onRetry, onBackToCatalog }: CancelProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center" role="main">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-3xl">
          ✕
        </div>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Payment cancelled</h1>
      <p className="mb-8 text-gray-600">
        Your payment was cancelled. No charge was made.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={onBackToCatalog}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to catalog
        </button>
        <button
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
