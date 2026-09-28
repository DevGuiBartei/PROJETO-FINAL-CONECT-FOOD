import React, { useState } from 'react';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  initialRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  initialRating = 0,
  onRate,
  readonly = false,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (value: number) => {
    if (readonly) {
      return;
    }

    setRating(value);

    if (onRate) {
      onRate(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isSelected = star <= rating;
        const isHovered = star <= hoverRating;

        let starClass = 'w-7 h-7 transition-all duration-200';

        if (isSelected || isHovered) {
          starClass += ' text-[#FF2C2C] fill-[#FF2C2C]';
        } else {
          starClass += ' text-gray-300 fill-transparent opacity-60';
        }

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => {
              if (!readonly) {
                setHoverRating(star);
              }
            }}
            onMouseLeave={() => {
              if (!readonly) {
                setHoverRating(0);
              }
            }}
            className="p-1 rounded-md transition-all duration-200 cursor-pointer hover:scale-110"
          >
            <Star className={starClass} />
          </button>
        );
      })}
    </div>
  );
};

