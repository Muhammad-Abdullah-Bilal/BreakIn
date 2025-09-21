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

// This is a mock implementation. In a real application, you would fetch from an API
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
      // In a real application, this would be an API call with the filters applied
      // const response = await api.get('/jobs', { params: filters });
      // setJobs(response.data);
      
      // Mock implementation with a delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Here we're just returning mock data
      // This would be replaced with actual API call in production
      setJobs(MOCK_JOBS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch jobs'));
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  const saveJob = (jobId: string) => {
    setSavedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev;
      }
      
      // In a real app, you'd also save this to API/localStorage
      return [...prev, jobId];
    });
  };
  
  const unsaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      // In a real app, you'd also update this in API/localStorage
      return prev.filter(id => id !== jobId);
    });
  };

  useEffect(() => {
    if (fetchOnMount) {
      fetchJobs();
    }
    
    // In a real app, load saved jobs from localStorage or user profile
    const loadSavedJobs = async () => {
      try {
        // Mock implementation
        // In real app: const savedJobIds = await api.get('/user/saved-jobs');
        // setSavedJobs(savedJobIds);
      } catch (err) {
        console.error("Failed to load saved jobs", err);
      }
    };
    
    loadSavedJobs();
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

// Mock data for development
const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    companyId: "c1",
    companyName: "TechCorp",
    companyLogoUrl: "https://via.placeholder.com/150",
    description: "We are seeking an experienced Frontend Developer to join our team. The ideal candidate will have strong expertise in React and TypeScript.",
    type: "FULL_TIME" as const,
    experienceLevel: "SENIOR" as const,
    minSalary: 90000,
    maxSalary: 120000,
    currency: "USD",
    location: "New York, NY",
    isRemote: true,
    skills: ["React", "TypeScript", "Next.js", "CSS", "HTML"],
    responsibilities: [
      "Develop new user-facing features using React.js",
      "Build reusable components for future use",
      "Optimize application for maximum speed and scalability",
      "Collaborate with back-end developers and web designers",
    ],
    requirements: [
      "3+ years of experience with React.js",
      "Strong proficiency in TypeScript",
      "Experience with responsive design",
      "Knowledge of modern frontend build pipelines and tools",
    ],
    benefits: [
      "Competitive salary",
      "Health insurance",
      "401(k) matching",
      "Flexible working hours",
    ],
    status: "PUBLISHED" as const,
    postedBy: "u123",
    postedAt: "2023-06-15T10:00:00Z",
    expiresAt: "2023-07-15T23:59:59Z",
    applicationsCount: 12,
  },
  {
    id: "2",
    title: "Backend Developer",
    companyId: "c2",
    companyName: "DataSystems Inc.",
    description: "Looking for a Backend Developer with experience in Node.js and MongoDB to join our growing team.",
    type: "FULL_TIME" as const,
    experienceLevel: "MID" as const,
    minSalary: 75000,
    maxSalary: 95000,
    currency: "USD",
    location: "Austin, TX",
    isRemote: false,
    skills: ["Node.js", "MongoDB", "Express", "REST APIs", "GraphQL"],
    responsibilities: [
      "Design and develop high-performance, reliable APIs",
      "Work with database schemas and queries",
      "Implement security and data protection",
      "Integrate with third-party services",
    ],
    requirements: [
      "2+ years of experience with Node.js",
      "Experience with MongoDB or similar NoSQL databases",
      "Understanding of server-side templating languages",
      "Basic understanding of frontend technologies",
    ],
    benefits: [
      "Health and dental insurance",
      "Paid time off",
      "Professional development budget",
      "Company events",
    ],
    status: "PUBLISHED" as const,
    postedBy: "u456",
    postedAt: "2023-06-10T14:30:00Z",
    applicationsCount: 8,
  },
  {
    id: "3",
    title: "DevOps Engineer",
    companyId: "c3",
    companyName: "CloudSolutions",
    companyLogoUrl: "https://via.placeholder.com/150",
    description: "We're hiring a DevOps Engineer to help build and maintain our cloud infrastructure.",
    type: "CONTRACT" as const,
    experienceLevel: "SENIOR" as const,
    minSalary: 110000,
    currency: "USD",
    location: "Remote",
    isRemote: true,
    skills: ["AWS", "Kubernetes", "Docker", "CI/CD", "Terraform"],
    responsibilities: [
      "Manage and scale our AWS infrastructure",
      "Implement and maintain CI/CD pipelines",
      "Monitor system performance and optimize resources",
      "Automate deployment processes",
    ],
    requirements: [
      "5+ years of experience in DevOps or similar role",
      "Strong experience with AWS services",
      "Experience with containerization and orchestration",
      "Knowledge of infrastructure as code principles",
    ],
    status: "PUBLISHED" as const,
    postedBy: "u789",
    postedAt: "2023-06-05T09:15:00Z",
    expiresAt: "2023-07-05T23:59:59Z",
    applicationsCount: 5,
  },
];
