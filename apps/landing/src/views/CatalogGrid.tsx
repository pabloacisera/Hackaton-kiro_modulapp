import { PrototypeDto } from '../models/catalogApi';
import { PrototypeCard } from './PrototypeCard';

interface Props {
  items: PrototypeDto[];
  loading: boolean;
  onSelectPrototype: (id: string) => void;
}

export function CatalogGrid({ items, loading, onSelectPrototype }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500" role="status">
        No prototypes found matching your filters.
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Prototype catalog"
    >
      {items.map((p) => (
        <PrototypeCard key={p.id} prototype={p} onSelect={onSelectPrototype} />
      ))}
    </div>
  );
}
