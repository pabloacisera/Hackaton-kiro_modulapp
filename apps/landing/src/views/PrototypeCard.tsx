import { PrototypeDto } from '../models/catalogApi';

interface Props {
  prototype: PrototypeDto;
  onSelect: (id: string) => void;
}

export function PrototypeCard({ prototype: p, onSelect }: Props) {
  const thumb = p.images[0]?.url ?? '/placeholder.jpg';
  const inStock = p.buildOnDemand || p.stockQty > 0;

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
      onClick={() => onSelect(p.id)}
      aria-label={`View ${p.name}`}
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={thumb}
          alt={p.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!inStock && (
          <span className="absolute left-2 top-2 rounded bg-gray-800 px-2 py-0.5 text-xs text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
          {p.category.replace('_', ' ')}
        </span>
        <h3 className="mb-1 text-base font-semibold text-gray-900 line-clamp-2">{p.name}</h3>
        <p className="mb-3 flex-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${p.priceUsd.toFixed(2)}
          </span>
          {p.estimatedDeliveryDays && (
            <span className="text-xs text-gray-400">~{p.estimatedDeliveryDays}d delivery</span>
          )}
        </div>
      </div>
    </article>
  );
}
