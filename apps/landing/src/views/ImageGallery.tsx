import { useState } from 'react';
import { ProtoImageDto } from '../models/catalogApi';

interface Props {
  images: ProtoImageDto[];
  altPrefix: string;
}

export function ImageGallery({ images, altPrefix }: Props) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        No images
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-xl bg-gray-100">
        <img
          src={sorted[current].url}
          alt={`${altPrefix} — image ${current + 1}`}
          className="h-72 w-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + sorted.length) % sorted.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % sorted.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current ? 'border-blue-600' : 'border-transparent'
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
