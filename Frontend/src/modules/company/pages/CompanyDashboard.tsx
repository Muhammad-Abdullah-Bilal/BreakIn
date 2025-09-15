// CompanyDashboard: overview page

import { CandidateCard } from "../components/CandidateCard";
import { CompanyStats } from "../components/CompanyStats";

const MOCK_CANDIDATES = [
  { anonId: "101", skills: ["React", "TypeScript"], proofScore: 92 },
  { anonId: "102", skills: ["Node.js", "MongoDB"], proofScore: 88 },
  { anonId: "103", skills: ["Python", "FastAPI"], proofScore: 95 },
];

const MOCK_STATS = {
  avgReadiness: 89,
  responseTime: "2d",
  timeToHire: "10d",
  candidatePool: 37,
};

export default function CompanyDashboard() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Company Dashboard</h1>
      <CompanyStats stats={MOCK_STATS} />
      <h2 className="text-lg font-semibold mb-4">Active Candidates</h2>
      {MOCK_CANDIDATES.map((candidate) => (
        <CandidateCard key={candidate.anonId} candidate={candidate} />
      ))}
    </div>
  );
}
