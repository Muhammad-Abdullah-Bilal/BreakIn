// ProofPortfolio: display candidate’s submissions, scores

type Submission = {
  id: string;
  title: string;
  score: number;
  mentorReview: string;
};

const MOCK_SUBMISSIONS: Submission[] = [
  { id: "s1", title: "Frontend Challenge", score: 92, mentorReview: "Great job on UI and code quality." },
  { id: "s2", title: "API Integration", score: 88, mentorReview: "Solid integration, minor improvements needed." },
];

export function ProofPortfolio({ candidateId }: { candidateId: string }) {
  // In real app, fetch by candidateId
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-2">Proof of Work</h3>
      {MOCK_SUBMISSIONS.map((sub) => (
        <div key={sub.id} className="p-3 bg-white rounded shadow">
          <div className="font-medium">{sub.title}</div>
          <div className="text-xs text-gray-500">Score: {sub.score}</div>
          <div className="text-sm mt-1">Mentor: {sub.mentorReview}</div>
        </div>
      ))}
    </div>
  );
}
