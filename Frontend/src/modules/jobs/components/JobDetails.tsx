import React from "react";
import { Job } from "../types/job";

interface JobDetailsProps {
  job: Job;
  onApply: (jobId: string) => void;
  onBack: () => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  job,
  onApply,
  onBack,
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 dark:text-blue-400 mb-4 text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Jobs
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            {job.companyLogoUrl ? (
              <div className="h-16 w-16 flex-shrink-0">
                <img
                  src={job.companyLogoUrl}
                  alt={`${job.companyName} logo`}
                  className="h-full w-full object-contain rounded"
                />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-gray-500 dark:text-gray-400">
                  {job.companyName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{job.title}</h1>
              <p className="text-md text-gray-600 dark:text-gray-400">{job.companyName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 py-1 px-2 rounded">
                  {job.type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </span>
                <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 py-1 px-2 rounded">
                  {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                </span>
                {job.isRemote && (
                  <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 py-1 px-2 rounded">
                    Remote
                  </span>
                )}
                <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-1 px-2 rounded">
                  {job.location}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onSave?.(job.id)}
            className="text-gray-500 hover:text-yellow-500 focus:outline-none p-2"
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isSaved ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-6 h-6 ${isSaved ? "text-yellow-500" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>
        </div>

        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary</h3>
            <p className="mt-1 text-md">{formatSalary()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Posted</h3>
            <p className="mt-1 text-md">{formatDate(job.postedAt)}</p>
          </div>
          {job.expiresAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Closing Date</h3>
              <p className="mt-1 text-md">{formatDate(job.expiresAt)}</p>
            </div>
          )}
          {job.applicationsCount !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Applications</h3>
              <p className="mt-1 text-md">{job.applicationsCount} applicants</p>
            </div>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold mb-2">Job Description</h2>
          <div className="whitespace-pre-line">{job.description}</div>

          <h2 className="text-xl font-semibold mt-6 mb-2">Requirements</h2>
          <ul className="list-disc pl-5 space-y-1">
            {job.requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-2">Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            {job.responsibilities.map((responsibility, index) => (
              <li key={index}>{responsibility}</li>
            ))}
          </ul>

          {job.benefits && job.benefits.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-6 mb-2">Benefits</h2>
              <ul className="list-disc pl-5 space-y-1">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </>
          )}

          <h2 className="text-xl font-semibold mt-6 mb-2">Required Skills</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {job.skills.map((skill, index) => (
              <span
                key={index}
                className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 py-1 px-2 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => onApply(job.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          >
            Apply for this position
          </button>
          {job.contactEmail && (
            <a
              href={`mailto:${job.contactEmail}?subject=Inquiry about ${job.title} position`}
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Contact Employer
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
