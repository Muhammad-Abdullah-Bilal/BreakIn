// JobPostingsPage: company job listings

import { JobCard } from "../components/JobCard";

const MOCK_JOBS = [
  { id: "j1", title: "Frontend Developer", description: "React, TypeScript, Tailwind", postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: "j2", title: "Backend Developer", description: "Node.js, MongoDB, API Design", postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
];

export default function JobPostingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Job Postings</h1>
      {MOCK_JOBS.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
