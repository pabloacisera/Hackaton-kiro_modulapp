import { useEffect, useRef, useState } from 'react';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Reusable search input with debounce for table filtering.
 * Emits onChange after the user stops typing (default 300ms).
 */
export function TableSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
}: TableSearchProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  };

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={placeholder}
    />
  );
}
