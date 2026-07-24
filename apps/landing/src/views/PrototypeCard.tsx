import { PrototypeDto } from '../models/catalogApi';
import { KeyboardEvent } from 'react';

interface Props {
  prototype: PrototypeDto;
  onSelect: (id: string) => void;
}

export function PrototypeCard({ prototype: p, onSelect }: Props) {
  const thumb = p.images[0]?.url ?? '/placeholder.jpg';
  const inStock = p.buildOnDemand || p.stockQty > 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(p.id);
    }
  };

  return (
    <article
      className="card-hover group flex cursor-pointer flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      onClick={() => onSelect(p.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`View ${p.name}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
        <img
          src={thumb}
          alt={p.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Stock badge */}
        {!inStock && (
          <span className="absolute left-3 top-3 badge bg-gray-900/80 text-white backdrop-blur-sm">
            Out of stock
          </span>
        )}
        {p.buildOnDemand && inStock && (
          <span className="absolute left-3 top-3 badge bg-accent-500/90 text-white backdrop-blur-sm">
            Made to order
          </span>
        )}

        {/* Category pill */}
        <span className="absolute right-3 top-3 badge bg-white/90 text-brand-700 backdrop-blur-sm">
          {p.category === 'modular_furniture' ? '🛋️ Furniture' : '🎀 Arches'}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
          {p.name}
        </h3>
        <p className="mt-1.5 flex-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xl font-bold text-brand-700">${p.priceUsd.toFixed(2)}</span>
          <div className="flex items-center gap-1.5">
            {inStock && <span className="h-2 w-2 rounded-full bg-green-500" title="In stock" />}
            {p.estimatedDeliveryDays && (
              <span className="text-xs text-gray-400">~{p.estimatedDeliveryDays}d</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
