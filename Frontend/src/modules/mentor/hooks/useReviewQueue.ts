// useReviewQueue hook

import { useCallback, useEffect, useState } from "react";
import type { Review } from "../types/review";

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    submissionId: "s1",
    reviewer: "mentor1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "pending",
  },
  {
    id: "r2",
    submissionId: "s2",
    reviewer: "mentor1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "pending",
  },
  {
    id: "r3",
    submissionId: "s3",
    reviewer: "mentor1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "completed",
  },
];

interface UseReviewQueueOptions {
  mentorId?: string;
  fetchOnMount?: boolean;
}

interface UseReviewQueueReturn {
  reviews: Review[];
  loading: boolean;
  error: Error | null;
  fetchReviews: () => Promise<void>;
  claimReview: (reviewId: string) => Promise<void>;
  completeReview: (reviewId: string) => Promise<void>;
}

export function useReviewQueue({ 
  mentorId, 
  fetchOnMount = true 
}: UseReviewQueueOptions = {}): UseReviewQueueReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/reviews', { params: { mentorId } });
      // setReviews(response.data);
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter reviews by mentorId if provided
      const filteredReviews = mentorId 
        ? MOCK_REVIEWS.filter(review => review.reviewer === mentorId)
        : MOCK_REVIEWS;
      
      setReviews(filteredReviews);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const claimReview = useCallback(async (reviewId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // await api.put(`/reviews/${reviewId}/claim`, { mentorId });
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { ...review, reviewer: mentorId || 'current-mentor' } 
            : review
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to claim review'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const completeReview = useCallback(async (reviewId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // await api.put(`/reviews/${reviewId}/complete`);
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { ...review, status: 'completed' } 
            : review
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete review'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchReviews();
    }
  }, [fetchOnMount, fetchReviews]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    claimReview,
    completeReview,
  };
}
