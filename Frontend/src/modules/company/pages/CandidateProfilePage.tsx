// CandidateProfilePage: detailed anonymous proof-of-work portfolio

import { ProofPortfolio } from "../components/ProofPortfolio";

const MOCK_CANDIDATE = {
  anonId: "101",
  skills: ["React", "TypeScript"],
  proofScore: 92,
  trustScore: 4.7,
  growth: "Rising",
};

export default function CandidateProfilePage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Anonymous Candidate #{MOCK_CANDIDATE.anonId}</h1>
      <div className="mb-4">
        <div>Skills: {MOCK_CANDIDATE.skills.join(", ")}</div>
        <div>Proof Score: {MOCK_CANDIDATE.proofScore}</div>
        <div>Trust Score: {MOCK_CANDIDATE.trustScore}</div>
        <div>Growth: {MOCK_CANDIDATE.growth}</div>
      </div>
      <ProofPortfolio candidateId={MOCK_CANDIDATE.anonId} />
    </div>
  );
}
