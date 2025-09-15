import JobPostingForm from "../components/JobPostingForm";

export default function JobPostingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Job Postings</h1>
      <JobPostingForm />
    </div>
  );
}
