"use client";

// useMentees hook

import { useCallback, useEffect, useState } from "react";
import { Mentee, MenteeSubmission } from "../types/mentee";

const MOCK_MENTEES: Mentee[] = [
  {
    id: "m1",
    userId: "u1",
    name: "John Smith",
    email: "john@example.com",
    profileImage: "https://i.pravatar.cc/150?u=1",
    skills: ["JavaScript", "React", "TypeScript"],
    level: "intermediate",
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    status: "active",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    completedTasks: 12,
    pendingTasks: 3,
  },
  {
    id: "m2",
    userId: "u2",
    name: "Alice Johnson",
    email: "alice@example.com",
    profileImage: "https://i.pravatar.cc/150?u=2",
    skills: ["Python", "Django", "Data Science"],
    level: "advanced",
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: "inactive",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    completedTasks: 28,
    pendingTasks: 0,
  },
  {
    id: "m3",
    userId: "u3",
    name: "Carlos Martinez",
    email: "carlos@example.com",
    bio: "Software engineer with a passion for learning new technologies.",
    skills: ["Java", "Spring", "Microservices"],
    level: "beginner",
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: "onboarding",
    currentSprint: "s1",
    completedTasks: 1,
    pendingTasks: 5,
  },
];

const MOCK_SUBMISSIONS: MenteeSubmission[] = [
  {
    id: "sub1",
    menteeId: "m1",
    sprintId: "s1",
    taskId: "t1",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    content: "I've implemented the feature as requested. The main challenge was handling the edge cases...",
    status: "pending",
  },
  {
    id: "sub2",
    menteeId: "m1",
    sprintId: "s1",
    taskId: "t2",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    content: "Here's my solution to the algorithm problem. I used a dynamic programming approach...",
    status: "reviewed",
    feedback: "Good job! Consider optimizing the space complexity.",
    score: 85,
  },
  {
    id: "sub3",
    menteeId: "m2",
    sprintId: "s2",
    taskId: "t3",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    content: "I've created the data pipeline as requested. The ETL process handles the transformations...",
    status: "approved",
    feedback: "Excellent work! Your solution is efficient and well-documented.",
    score: 95,
  },
  {
    id: "sub4",
    menteeId: "m3",
    sprintId: "s1",
    taskId: "t1",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    content: "This is my first submission. I implemented the hello world program...",
    status: "pending",
  },
];

interface UseMenteesOptions {
  mentorId?: string;
  fetchOnMount?: boolean;
}

interface UseMenteesReturn {
  mentees: Mentee[];
  loading: boolean;
  error: Error | null;
  fetchMentees: () => Promise<void>;
  getMenteeById: (id: string) => Mentee | undefined;
  getMenteeSubmissions: (menteeId: string) => Promise<MenteeSubmission[]>;
  reviewSubmission: (
    submissionId: string,
    feedback: string,
    score: number,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
}

export function useMentees({
  mentorId,
  fetchOnMount = true,
}: UseMenteesOptions = {}): UseMenteesReturn {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [submissions, setSubmissions] = useState<MenteeSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/mentees', { params: { mentorId } });
      // setMentees(response.data);
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setMentees(MOCK_MENTEES);
      setSubmissions(MOCK_SUBMISSIONS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch mentees'));
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const getMenteeById = useCallback((id: string) => {
    return mentees.find(mentee => mentee.id === id);
  }, [mentees]);

  const getMenteeSubmissions = useCallback(async (menteeId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.get(`/mentees/${menteeId}/submissions`);
      // return response.data;
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const menteeSubmissions = submissions.filter(
        submission => submission.menteeId === menteeId
      );
      
      return menteeSubmissions;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch mentee submissions'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [submissions]);

  const reviewSubmission = useCallback(async (
    submissionId: string,
    feedback: string,
    score: number,
    status: 'approved' | 'rejected'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // await api.put(`/submissions/${submissionId}/review`, {
      //   feedback,
      //   score,
      //   status
      // });
      
      // Mock implementation with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId
            ? {
                ...submission,
                status,
                feedback,
                score,
                updatedAt: new Date().toISOString()
              }
            : submission
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to review submission'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchMentees();
    }
  }, [fetchOnMount, fetchMentees]);

  return {
    mentees,
    loading,
    error,
    fetchMentees,
    getMenteeById,
    getMenteeSubmissions,
    reviewSubmission,
  };
}
