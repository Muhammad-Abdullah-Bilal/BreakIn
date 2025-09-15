import React from "react";
import { Job, JobFilter } from "../types/job";
import { JobCard } from "./JobCard";

interface JobsListProps {
  jobs: Job[];
  filters?: JobFilter;
  loading?: boolean;
  onApplyJob: (jobId: string) => void;
  onSaveJob?: (jobId: string) => void;
  savedJobs?: string[];
}

export const JobsList: React.FC<JobsListProps> = ({
  jobs,
  loading = false,
  onApplyJob,
  onSaveJob,
  savedJobs = [],
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 h-40 bg-gray-50 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          No jobs found
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Try adjusting your search filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onApply={onApplyJob}
          onSave={onSaveJob}
          isSaved={savedJobs.includes(job.id)}
        />
      ))}
    </div>
  );
};
