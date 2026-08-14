"use client";

import { useCallback, useEffect, useState } from "react";
import { Mentee, MenteeSubmission } from "../types/mentee";

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
      const response = await fetch('/api/company/talent');
      if (!response.ok) {
        throw new Error('Failed to fetch live mentees');
      }
      const data = await response.json();
      const mappedMentees: Mentee[] = data.map((d: any, index: number) => ({
        id: d.id || `m_${index + 1}`,
        userId: d.email || `u_${index + 1}`,
        name: d.codename || d.displayName || 'Developer',
        email: d.email || 'developer@breakin.ai',
        profileImage: d.avatar_url || d.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        skills: d.skills || ['React', 'FastAPI'],
        level: (d.level?.toLowerCase().includes('senior') ? 'advanced' : d.level?.toLowerCase().includes('intermediate') ? 'intermediate' : 'beginner') as any,
        joinedAt: d.created_at || new Date().toISOString(),
        createdAt: d.created_at || new Date().toISOString(),
        updatedAt: d.updated_at || new Date().toISOString(),
        status: (d.status === 'In Sprint' ? 'active' : 'onboarding') as any,
        lastActivity: new Date().toISOString(),
        completedTasks: d.sprint_history || 4,
        pendingTasks: 2,
      }));

      setMentees(mappedMentees);
    } catch (err) {
      console.error("Error fetching mentees:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch mentees'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getMenteeById = useCallback((id: string) => {
    return mentees.find(mentee => mentee.id === id);
  }, [mentees]);

  const getMenteeSubmissions = useCallback(async (menteeId: string) => {
    return submissions.filter(s => s.menteeId === menteeId);
  }, [submissions]);

  const reviewSubmission = useCallback(async (
    submissionId: string,
    feedback: string,
    score: number,
    status: 'approved' | 'rejected'
  ) => {
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
