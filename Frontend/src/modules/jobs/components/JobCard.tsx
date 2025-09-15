import React from "react";
import { ExperienceLevel, Job, JobType } from "../types/job";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onApply,
  onSave,
  isSaved = false,
}) => {
  const formatSalary = (): string => {
    if (!job.minSalary && !job.maxSalary) return "Salary not specified";
    if (job.minSalary && job.maxSalary) {
      return `${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} ${job.currency || "USD"}`;
    }
    if (job.minSalary) {
      return `${job.minSalary.toLocaleString()}+ ${job.currency || "USD"}`;
    }
    return `Up to ${job.maxSalary?.toLocaleString()} ${job.currency || "USD"}`;
  };

  const formatJobType = (type: JobType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };
  
  const formatExperienceLevel = (level: ExperienceLevel): string => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          {job.companyLogoUrl ? (
            <div className="h-12 w-12 flex-shrink-0">
              <img
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                className="h-full w-full object-contain rounded"
              />
            </div>
          ) : (
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                {job.companyName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{job.companyName}</p>
          </div>
        </div>
        <button
          onClick={() => onSave?.(job.id)}
          className="text-gray-500 hover:text-yellow-500 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isSaved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-5 h-5 ${isSaved ? "text-yellow-500" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 py-1 px-2 rounded">
            {formatJobType(job.type)}
          </span>
          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 py-1 px-2 rounded">
            {formatExperienceLevel(job.experienceLevel)}
          </span>
          {job.isRemote && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 py-1 px-2 rounded">
              Remote
            </span>
          )}
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-1 px-2 rounded">
            {job.location}
          </span>
        </div>

        <p className="text-sm font-medium">
          {formatSalary()}
        </p>

        <div className="flex flex-wrap gap-1 mt-2">
          {job.skills.slice(0, 5).map((skill, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 py-0.5 px-2 rounded"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 py-0.5 px-2 rounded">
              +{job.skills.length - 5}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Posted {new Date(job.postedAt).toLocaleDateString()}
        </p>
        <button
          onClick={() => onApply(job.id)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Apply
        </button>
      </div>
    </div>
  );
};
