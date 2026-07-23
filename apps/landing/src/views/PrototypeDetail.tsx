import { useEffect, useState } from 'react';
import { PrototypeDto, subscribeCatalogStream } from '../models/catalogApi';
import { ImageGallery } from './ImageGallery';

interface Props {
  prototype: PrototypeDto;
  onBuy: (id: string) => void;
  onBack: () => void;
}

export function PrototypeDetail({ prototype: initial, onBuy, onBack }: Props) {
  const [proto, setProto] = useState<PrototypeDto>(initial);
  const [deactivated, setDeactivated] = useState(false);

  // ── TASK-catalog-8: deactivation notice via SSE ──────────────────────────
  useEffect(() => {
    const cleanup = subscribeCatalogStream((event) => {
      if (event.payload.id !== proto.id) return;

      if (event.type === 'prototype.deactivated') {
        setDeactivated(true);
        setProto((p) => ({ ...p, active: false }));
      } else if (event.type === 'prototype.updated') {
        setProto((p) => ({ ...p, ...event.payload }));
      }
    });
    return cleanup;
  }, [proto.id]);

  const isPurchasable = !deactivated && (proto.buildOnDemand || proto.stockQty > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        ← Back to catalog
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <ImageGallery images={proto.images} altPrefix={proto.name} />

        {/* Details */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {proto.category.replace('_', ' ')}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{proto.name}</h1>
          <p className="text-gray-600">{proto.description}</p>

          <div className="text-2xl font-bold text-gray-900">
            ${proto.priceUsd.toFixed(2)}
          </div>

          {proto.estimatedDeliveryDays && (
            <p className="text-sm text-gray-500">
              Estimated delivery: ~{proto.estimatedDeliveryDays} days
            </p>
          )}

          {/* Deactivation notice */}
          {deactivated && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              This prototype is no longer available.
            </div>
          )}

          {/* Buy button — hidden when deactivated */}
          {!deactivated && (
            <button
              onClick={() => onBuy(proto.id)}
              disabled={!isPurchasable}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              aria-disabled={!isPurchasable}
            >
              {isPurchasable ? 'Buy now' : 'Out of stock'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
