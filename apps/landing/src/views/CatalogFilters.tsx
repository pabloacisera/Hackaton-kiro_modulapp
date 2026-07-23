import { ChangeEvent, useState } from 'react';
import { CatalogFilter } from '../models/catalogApi';

interface Props {
  filter: CatalogFilter;
  onFilterChange: (f: Partial<CatalogFilter>) => void;
}

export function CatalogFilters({ filter, onFilterChange }: Props) {
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() ?? '');

  const handleCategory = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as CatalogFilter['category'];
    onFilterChange({ category: val || undefined });
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ q: e.target.value || undefined });
  };

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  return (
    <aside className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm">
      {/* Search */}
      <div className="flex flex-col gap-1">
        <label htmlFor="search" className="text-xs font-medium text-gray-600">
          Search
        </label>
        <input
          id="search"
          type="text"
          defaultValue={filter.q ?? ''}
          onChange={handleSearch}
          placeholder="Name or description…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search prototypes"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium text-gray-600">
          Category
        </label>
        <select
          id="category"
          defaultValue={filter.category ?? ''}
          onChange={handleCategory}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          <option value="modular_furniture">Modular Furniture</option>
          <option value="arches">Arches</option>
        </select>
      </div>

      {/* Price range */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Price (USD)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            min={0}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            aria-label="Minimum price"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            min={0}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            aria-label="Maximum price"
          />
          <button
            onClick={handlePriceApply}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            aria-label="Apply price filter"
          >
            Apply
          </button>
        </div>
      </div>
    </aside>
  );
}
