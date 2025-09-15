export default function CandidateCard({ candidate }: { candidate: any }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{candidate.name || 'Anon'}</div>
          <div className="text-xs text-gray-500">{candidate.track || 'Frontend'}</div>
        </div>
        <div className="text-sm font-medium text-indigo-600 flex items-center">
          <span aria-label="Proof score">{candidate.proofScore || 0}pt</span>
          {candidate.verified && (
            <span className="ml-1 text-green-500" aria-label="Verified">✓</span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600">{candidate.bio || '—'}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {candidate.skills?.map((skill: string) => (
          <span key={skill} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button 
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
          aria-label={`View profile of ${candidate.name || 'candidate'}`}
        >
          View
        </button>
        <button 
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
          aria-label={`Message ${candidate.name || 'candidate'}`}
        >
          Ping
        </button>
      </div>
    </div>
  );
}
