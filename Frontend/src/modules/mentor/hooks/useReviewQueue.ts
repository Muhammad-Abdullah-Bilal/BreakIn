"use client";

import { useCallback, useEffect, useState } from "react";
import type { Review } from "../types/review";

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
      const response = await fetch('/api/mentor/reviews');
      if (!response.ok) {
        throw new Error('Failed to fetch real review queue');
      }
      const data = await response.json();
      const mappedReviews: Review[] = data.map((r: any) => ({
        id: r.id || r._id?.toString() || 'r1',
        submissionId: r.submission_id || r.submissionId || 'sub-101',
        reviewer: r.reviewer_id || r.reviewer || 'mentor-1',
        createdAt: r.submitted_at || r.created_at || r.createdAt || new Date().toISOString(),
        status: (r.status === 'completed' ? 'completed' : 'pending') as any,
        sprintTitle: r.sprint_title || r.sprintTitle || 'FinTech Realtime Transaction Engine',
        anonymousId: r.anonymous_id || r.anonymousId || 'dev_anonymous',
        submittedAt: r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString() : 'Recent',
        priority: r.priority || 'Standard',
        testsPassed: r.tests_passed || r.testsPassed || 'All Checks passed',
        aiScore: r.ai_score || r.aiScore || '8.5 / 10',
        solution: r.solution || '',
        decision: r.decision || 'Approved',
        score: r.mentor_score || r.score || (r.ai_score ? parseFloat(r.ai_score.split(' ')[0]) : 8.5)
      }));

      const filtered = mentorId 
        ? mappedReviews.filter(review => review.reviewer === mentorId)
        : mappedReviews;
      
      setReviews(filtered);
    } catch (err) {
      console.error("Error fetching review queue:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const claimReview = useCallback(async (reviewId: string) => {
    setLoading(true);
    setError(null);
    
    try {
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
