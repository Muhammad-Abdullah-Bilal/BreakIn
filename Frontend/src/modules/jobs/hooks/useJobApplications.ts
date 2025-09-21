"use client";

import { useCallback, useState } from "react";
import { ApplicationStatus, JobApplication } from "../types/job";

interface UseJobApplicationOptions {
  userId?: string;
}

interface UseJobApplicationReturn {
  applications: JobApplication[];
  loading: boolean;
  error: Error | null;
  applyToJob: (jobId: string, application: Partial<JobApplication>) => Promise<void>;
  withdrawApplication: (applicationId: string) => Promise<void>;
  getApplicationForJob: (jobId: string) => JobApplication | undefined;
  getUserApplications: () => Promise<void>;
}

export const useJobApplications = ({
  userId,
}: UseJobApplicationOptions = {}): UseJobApplicationReturn => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getUserApplications = useCallback(async () => {
    if (!userId) {
      setError(new Error("User ID is required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real application, this would be an API call
      // const response = await api.get(`/users/${userId}/applications`);
      // setApplications(response.data);

      // Mock implementation with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setApplications(MOCK_APPLICATIONS.filter(app => app.userId === userId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch applications"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const applyToJob = useCallback(
    async (jobId: string, application: Partial<JobApplication>) => {
      if (!userId) {
        setError(new Error("User ID is required"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // In a real application, this would be an API call
        // const response = await api.post('/applications', {
        //   jobId,
        //   userId,
        //   ...application
        // });
        // setApplications(prev => [...prev, response.data]);

        // Mock implementation with a delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const newApplication: JobApplication = {
          id: `app-${Date.now()}`,
          jobId,
          userId: userId,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date().toISOString(),
          lastStatusUpdateAt: new Date().toISOString(),
          ...application,
        };

        setApplications((prev) => [...prev, newApplication]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to apply for job"));
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const withdrawApplication = useCallback(async (applicationId: string) => {
    setLoading(true);
    setError(null);

    try {
      // In a real application, this would be an API call
      // await api.put(`/applications/${applicationId}`, { status: ApplicationStatus.WITHDRAWN });

      // Mock implementation with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: ApplicationStatus.WITHDRAWN, lastStatusUpdateAt: new Date().toISOString() }
            : app
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to withdraw application"));
    } finally {
      setLoading(false);
    }
  }, []);

  const getApplicationForJob = useCallback(
    (jobId: string) => {
      return applications.find((app) => app.jobId === jobId && app.status !== ApplicationStatus.WITHDRAWN);
    },
    [applications]
  );

  return {
    applications,
    loading,
    error,
    applyToJob,
    withdrawApplication,
    getApplicationForJob,
    getUserApplications,
  };
};

// Mock data for development
const MOCK_APPLICATIONS: JobApplication[] = [
  {
    id: "app1",
    jobId: "1",
    userId: "u1",
    status: ApplicationStatus.REVIEWING,
    coverLetter: "I am excited to apply for this position...",
    resumeUrl: "https://example.com/resume.pdf",
    appliedAt: "2023-06-20T15:30:00Z",
    lastStatusUpdateAt: "2023-06-22T09:15:00Z",
  },
  {
    id: "app2",
    jobId: "2",
    userId: "u1",
    status: ApplicationStatus.APPLIED,
    resumeUrl: "https://example.com/resume.pdf",
    appliedAt: "2023-06-18T10:45:00Z",
    lastStatusUpdateAt: "2023-06-18T10:45:00Z",
  },
];
