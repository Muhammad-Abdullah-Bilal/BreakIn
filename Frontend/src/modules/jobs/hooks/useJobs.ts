"use client";

import { useCallback, useEffect, useState } from "react";
import { Job, JobFilter } from "../types/job";

interface UseJobsOptions {
  initialFilters?: JobFilter;
  fetchOnMount?: boolean;
}

interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: Error | null;
  filters: JobFilter;
  setFilters: (filters: JobFilter) => void;
  fetchJobs: () => Promise<void>;
  savedJobs: string[];
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
}

export const useJobs = ({ 
  initialFilters = {}, 
  fetchOnMount = true 
}: UseJobsOptions = {}): UseJobsReturn => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<JobFilter>(initialFilters);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('skill', filters.search);
      if (filters.skills && filters.skills.length > 0) params.append('skill', filters.skills[0]);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/jobs${query}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch real jobs');
      }
      
      const data = await response.json();
      const mappedJobs: Job[] = data.map((j: any) => ({
        id: j.id || j._id?.toString() || String(Math.random()),
        title: j.title,
        companyId: j.companyId || "comp-1",
        companyName: j.company || "BreakIn Partner",
        description: j.description || "",
        type: j.type === 'Contract' ? 'CONTRACT' : 'FULL_TIME',
        experienceLevel: 'SENIOR',
        minSalary: j.salaryMin || 100000,
        maxSalary: j.salaryMax || 150000,
        currency: 'USD',
        location: j.location || 'Remote',
        isRemote: true,
        skills: j.skills || [],
        responsibilities: [
          'Design and scale high-concurrency microservices',
          'Collaborate directly with cross-functional sprint engineering teams',
          'Deploy automated tests and CI/CD evaluation pipelines'
        ],
        requirements: [
          'Demonstrated Proof of Work in verified technical sprints',
          'Strong foundation in distributed systems and modern web frameworks'
        ],
        benefits: [
          'Competitive compensation with equity allocation',
          'Comprehensive health and wellness benefits',
          'Remote-first flexible engineering environment'
        ],
        status: 'PUBLISHED',
        postedBy: 'admin',
        postedAt: j.created_at || new Date().toISOString(),
        applicationsCount: j.applicantsCount || 0
      }));

      setJobs(mappedJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch jobs'));
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  const saveJob = (jobId: string) => {
    setSavedJobs(prev => {
      if (prev.includes(jobId)) return prev;
      const updated = [...prev, jobId];
      try { localStorage.setItem('saved_jobs', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };
  
  const unsaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const updated = prev.filter(id => id !== jobId);
      try { localStorage.setItem('saved_jobs', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  useEffect(() => {
    if (fetchOnMount) {
      fetchJobs();
    }
    
    try {
      const stored = localStorage.getItem('saved_jobs');
      if (stored) setSavedJobs(JSON.parse(stored));
    } catch {}
  }, [fetchOnMount, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    filters,
    setFilters,
    fetchJobs,
    savedJobs,
    saveJob,
    unsaveJob,
  };
};
