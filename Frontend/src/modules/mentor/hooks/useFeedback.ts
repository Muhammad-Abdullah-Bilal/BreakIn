// useFeedback hook

import { useCallback, useEffect, useState } from "react";
import { Feedback, FeedbackRubric } from "../types/feedback";

const MOCK_RUBRIC: FeedbackRubric = {
  id: "r1",
  name: "Standard Feedback Rubric",
  description: "Standard rubric for evaluating submissions",
  components: [
    {
      key: "code_quality",
      name: "Code Quality",
      description: "Code structure, readability, and organization",
      weight: 0.3,
      maxScore: 10
    },
    {
      key: "correctness",
      name: "Correctness",
      description: "Does the solution solve the problem correctly?",
      weight: 0.4,
      maxScore: 10
    },
    {
      key: "efficiency",
      name: "Efficiency",
      description: "Time and space complexity",
      weight: 0.2,
      maxScore: 10
    },
    {
      key: "documentation",
      name: "Documentation",
      description: "Comments, README, and other documentation",
      weight: 0.1,
      maxScore: 10
    }
  ],
  isActive: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
};

const MOCK_FEEDBACKS: Feedback[] = [
  {
    id: "f1",
    reviewId: "r1",
    mentorId: "mentor1",
    menteeId: "m1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    technical: 8,
    completeness: 7,
    communication: 9,
    scores: {
      code_quality: 8,
      correctness: 7,
      efficiency: 6,
      documentation: 9
    },
    normalizedScore: 7.5,
    comments: "Good job overall. The solution works correctly, but could be more efficient.",
    strengths: ["Clean code", "Good documentation", "Clear variable names"],
    improvements: ["Consider using a more efficient algorithm", "Add unit tests"],
    status: "submitted"
  },
  {
    id: "f2",
    reviewId: "r2",
    mentorId: "mentor1",
    menteeId: "m2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    technical: 9,
    completeness: 10,
    communication: 8,
    scores: {
      code_quality: 9,
      correctness: 10,
      efficiency: 9,
      documentation: 8
    },
    normalizedScore: 9.2,
    comments: "Excellent work! Your solution is elegant and efficient.",
    strengths: ["Elegant algorithm", "Optimal time complexity", "Thorough test cases"],
    improvements: ["Add more comments to explain the approach"],
    status: "acknowledged"
  }
];

interface UseFeedbackOptions {
  mentorId?: string;
  fetchOnMount?: boolean;
}

interface UseFeedbackReturn {
  feedbacks: Feedback[];
  activeRubric: FeedbackRubric | null;
  loading: boolean;
  error: Error | null;
  fetchFeedbacks: () => Promise<void>;
  getFeedbackByReviewId: (reviewId: string) => Feedback | undefined;
  createFeedback: (feedback: Partial<Feedback>) => Promise<void>;
  updateFeedback: (id: string, feedback: Partial<Feedback>) => Promise<void>;
  fetchRubric: () => Promise<FeedbackRubric | null>;
}

export function useFeedback({
  mentorId,
  fetchOnMount = true
}: UseFeedbackOptions = {}): UseFeedbackReturn {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeRubric, setActiveRubric] = useState<FeedbackRubric | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/feedbacks', { params: { mentorId } });
      // setFeedbacks(response.data);
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter feedbacks by mentorId if provided
      const filteredFeedbacks = mentorId
        ? MOCK_FEEDBACKS.filter(feedback => feedback.mentorId === mentorId)
        : MOCK_FEEDBACKS;
      
      setFeedbacks(filteredFeedbacks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feedbacks'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const fetchRubric = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/rubrics/active');
      // setActiveRubric(response.data);
      // return response.data;
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setActiveRubric(MOCK_RUBRIC);
      return MOCK_RUBRIC;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch active rubric'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeedbackByReviewId = useCallback((reviewId: string) => {
    return feedbacks.find(feedback => feedback.reviewId === reviewId);
  }, [feedbacks]);

  const createFeedback = useCallback(async (feedback: Partial<Feedback>) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.post('/feedbacks', feedback);
      // const newFeedback = response.data;
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newFeedback: Feedback = {
        id: `f${Math.random().toString(36).substring(2, 9)}`,
        reviewId: feedback.reviewId || '',
        mentorId: feedback.mentorId || mentorId || 'unknown',
        menteeId: feedback.menteeId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        technical: feedback.technical || 0,
        completeness: feedback.completeness || 0,
        communication: feedback.communication || 0,
        scores: feedback.scores || {},
        comments: feedback.comments || '',
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
        status: feedback.status || 'draft',
      };
      
      setFeedbacks(prev => [...prev, newFeedback]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create feedback'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const updateFeedback = useCallback(async (id: string, feedback: Partial<Feedback>) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // await api.put(`/feedbacks/${id}`, feedback);
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFeedbacks(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, ...feedback, updatedAt: new Date().toISOString() }
            : f
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update feedback'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchFeedbacks();
      fetchRubric();
    }
  }, [fetchOnMount, fetchFeedbacks, fetchRubric]);

  return {
    feedbacks,
    activeRubric,
    loading,
    error,
    fetchFeedbacks,
    getFeedbackByReviewId,
    createFeedback,
    updateFeedback,
    fetchRubric,
  };
}
