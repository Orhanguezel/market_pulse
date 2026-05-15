'use client';

import { IconStar } from '@/components/ui/icons';
import { clampRating } from '@/integrations/shared';

type StarRatingProps = {
  rating: number;
  interactive?: boolean;
  size?: number;
  onRate?: (r: number) => void;
};

export default function StarRating({ rating, interactive, size = 18, onRate }: StarRatingProps) {
  const current = clampRating(rating);

  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= current;

        if (interactive && onRate) {
          return (
            <button
              key={idx}
              type="button"
              className={`transition-all duration-200 ${filled ? 'text-brand-primary scale-105' : 'text-sand-300 hover:text-brand-primary'}`}
              onClick={() => onRate(idx)}
              aria-label={`Rate ${idx}`}
            >
              <IconStar filled={filled} size={size} />
            </button>
          );
        }

        return (
          <IconStar
            key={idx}
            filled={filled}
            size={size}
            className={filled ? 'text-brand-primary' : 'text-sand-300'}
          />
        );
      })}
    </div>
  );
}
