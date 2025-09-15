import React, { useState } from 'react';
import { Review } from '../types/review';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
  reviews: Review[];
  onSelectReview: (review: Review) => void;
  loading?: boolean;
}

export function ReviewList({ reviews, onSelectReview, loading = false }: ReviewListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value as 'all' | 'pending' | 'completed');
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div 
            key={index} 
            className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Review Queue</h3>
        <div>
          <select
            value={filter}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? 'No reviews found' 
              : filter === 'pending' 
                ? 'No pending reviews' 
                : 'No completed reviews'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onSelect={onSelectReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
