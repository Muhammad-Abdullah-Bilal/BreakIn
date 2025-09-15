'use client';

import React, { useState } from 'react';
import { FeedbackRating } from '../types/feedback';

interface FeedbackRatingStarsProps {
  rating: FeedbackRating;
  onChange?: (rating: FeedbackRating) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FeedbackRatingStars: React.FC<FeedbackRatingStarsProps> = ({
  rating,
  onChange,
  readOnly = false,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState<FeedbackRating | null>(null);
  
  const getStarSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };
  
  const handleMouseEnter = (starRating: FeedbackRating) => {
    if (readOnly) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(null);
  };

  const handleClick = (starRating: FeedbackRating) => {
    if (readOnly || !onChange) return;
    onChange(starRating);
  };

  const stars = [1, 2, 3, 4, 5] as FeedbackRating[];
  const activeRating = hoverRating || rating;
  const starSizeClass = getStarSizeClass();

  return (
    <div className="flex items-center">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} p-1 focus:outline-none`}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(star)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          disabled={readOnly}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= activeRating ? 'currentColor' : 'none'}
            stroke={star <= activeRating ? 'currentColor' : 'currentColor'}
            className={`${starSizeClass} ${
              star <= activeRating
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={star <= activeRating ? 0 : 1.5}
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
      
      {!readOnly && (
        <span className="ml-2 text-sm text-muted-foreground">
          {activeRating === 1 && 'Poor'}
          {activeRating === 2 && 'Needs Improvement'}
          {activeRating === 3 && 'Satisfactory'}
          {activeRating === 4 && 'Good'}
          {activeRating === 5 && 'Excellent'}
        </span>
      )}
    </div>
  );
};
