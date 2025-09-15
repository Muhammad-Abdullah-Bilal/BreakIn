// JobPipelinePage: track candidates through hiring funnel

import { PipelineStage } from "../components/PipelineStage";

const MOCK_CANDIDATES = [
  { anonId: "101", skills: ["React", "TypeScript"], proofScore: 92 },
  { anonId: "102", skills: ["Node.js", "MongoDB"], proofScore: 88 },
  { anonId: "103", skills: ["Python", "FastAPI"], proofScore: 95 },
];

const MOCK_PIPELINE = [
  { title: "Applied", candidates: [MOCK_CANDIDATES[0]] },
  { title: "Interviewing", candidates: [MOCK_CANDIDATES[1]] },
  { title: "Offer", candidates: [MOCK_CANDIDATES[2]] },
];

export default function JobPipelinePage() {
  return (
    <div className="max-w-full mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Hiring Pipeline</h1>
      <div className="flex gap-4 overflow-x-auto">
        {MOCK_PIPELINE.map((stage) => (
          <PipelineStage key={stage.title} title={stage.title} candidates={stage.candidates} />
        ))}
      </div>
    </div>
  );
}
