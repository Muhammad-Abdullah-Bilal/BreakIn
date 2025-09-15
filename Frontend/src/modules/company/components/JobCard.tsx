// JobCard: company job post summary

type Job = {
  id: string;
  title: string;
  description: string;
  postedAt: string;
};

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow mb-4">
      <h3 className="font-semibold">{job.title}</h3>
      <p className="text-sm text-gray-600">{job.description}</p>
      <p className="text-xs text-gray-500">Posted: {new Date(job.postedAt).toLocaleDateString()}</p>
    </div>
  );
}
