import React, { useState } from "react";
import { Job } from "../types/job";

interface JobApplicationFormProps {
  job: Job;
  onSubmit: (formData: JobApplicationFormData) => void;
  onCancel: () => void;
}

export interface JobApplicationFormData {
  coverLetter: string;
  resumeUrl?: string;
  portfolioUrl?: string;
}

export const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  job,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<JobApplicationFormData>({
    coverLetter: "",
    resumeUrl: "",
    portfolioUrl: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      
      // In a real application, you would upload this file to a storage service
      // and get back a URL to use. For now, we're just setting a mock URL.
      setFormData((prev) => ({ 
        ...prev, 
        resumeUrl: `mock-url-for-${file.name}` 
      }));
      
      if (errors.resumeUrl) {
        setErrors((prev) => ({ ...prev, resumeUrl: "" }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = "Cover letter is required";
    }
    
    if (!formData.resumeUrl && !resumeFile) {
      newErrors.resumeUrl = "Resume is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real application, you would upload the resume file first if it exists,
      // then submit the form with the resume URL included
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting application:", error);
      setErrors({ form: "Failed to submit application. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Apply for {job.title}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Complete the form below to apply for this position at {job.companyName}.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
            {errors.form}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="resumeUrl" className="block text-sm font-medium mb-1">
            Resume *
          </label>
          <input
            type="file"
            id="resumeFile"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0 file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                       dark:file:bg-blue-900 dark:file:text-blue-200"
          />
          {resumeFile && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selected file: {resumeFile.name}
            </p>
          )}
          {errors.resumeUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.resumeUrl}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Accepted formats: PDF, DOC, DOCX. Max size: 5MB.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="coverLetter" className="block text-sm font-medium mb-1">
            Cover Letter *
          </label>
          <textarea
            id="coverLetter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleInputChange}
            rows={6}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Explain why you're interested in this position and why you're a good fit..."
          />
          {errors.coverLetter && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {errors.coverLetter}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="portfolioUrl" className="block text-sm font-medium mb-1">
            Portfolio URL (optional)
          </label>
          <input
            type="url"
            id="portfolioUrl"
            name="portfolioUrl"
            value={formData.portfolioUrl}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://your-portfolio.com"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add a link to your portfolio, personal website, or GitHub profile
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
