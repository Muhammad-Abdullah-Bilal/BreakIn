import React from "react";
import { ApplicationStatus, JobApplication } from "../types/job";

interface ApplicationsListProps {
  applications: JobApplication[];
  loading?: boolean;
  onWithdraw: (applicationId: string) => void;
  showJobTitle?: boolean;
}

interface JobInfoProps {
  jobId: string;
}

// This is a mock component - in a real application, you would fetch job details
const JobInfo: React.FC<JobInfoProps> = ({ jobId }) => {
  // Mock job data - in production this would come from a hook/API
  const jobTitles: Record<string, string> = {
    "1": "Senior Frontend Developer",
    "2": "Backend Developer",
    "3": "DevOps Engineer",
  };

  const companyNames: Record<string, string> = {
    "1": "TechCorp",
    "2": "DataSystems Inc.",
    "3": "CloudSolutions",
  };

  return (
    <div>
      <div className="font-medium">{jobTitles[jobId] || "Unknown Position"}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {companyNames[jobId] || "Unknown Company"}
      </div>
    </div>
  );
};

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  loading = false,
  onWithdraw,
  showJobTitle = true,
}) => {
  const getStatusColor = (status: ApplicationStatus): string => {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case ApplicationStatus.REVIEWING:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case ApplicationStatus.INTERVIEW:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case ApplicationStatus.OFFER:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case ApplicationStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case ApplicationStatus.HIRED:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
      case ApplicationStatus.WITHDRAWN:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusLabel = (status: ApplicationStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 h-24 bg-gray-50 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg">
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
          No applications yet
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          You haven't applied to any jobs yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div
          key={application.id}
          className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
        >
          <div className="flex justify-between items-start">
            {showJobTitle && <JobInfo jobId={application.jobId} />}
            
            <span
              className={`py-1 px-2 rounded text-xs ${getStatusColor(
                application.status
              )}`}
            >
              {getStatusLabel(application.status)}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Applied on</p>
              <p className="text-sm">
                {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated</p>
              <p className="text-sm">
                {new Date(application.lastStatusUpdateAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {application.interviewDate && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <p className="text-xs font-medium">Interview scheduled</p>
              <p className="text-sm">
                {new Date(application.interviewDate).toLocaleString()}
              </p>
            </div>
          )}

          {application.status !== ApplicationStatus.WITHDRAWN &&
           application.status !== ApplicationStatus.REJECTED &&
           application.status !== ApplicationStatus.HIRED && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onWithdraw(application.id)}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
              >
                Withdraw application
              </button>
            </div>
          )}

          {application.notes && (
            <div className="mt-2 border-t pt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Notes:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {application.notes}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
