// CandidateCard: card preview of a candidate

type Candidate = {
  anonId: string;
  skills: string[];
  proofScore: number;
};

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition mb-4">
      <h3 className="font-semibold">Anonymous Candidate #{candidate.anonId}</h3>
      <p className="text-sm text-gray-600">Skills: {candidate.skills.join(", ")}</p>
      <p className="text-xs text-gray-500">Proof Score: {candidate.proofScore}</p>
      <button className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg">
        View Portfolio
      </button>
    </div>
  );
}
