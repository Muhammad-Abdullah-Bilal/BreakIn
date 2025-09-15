// PipelineStage: kanban stage for tracking candidates

import { CandidateCard } from "./CandidateCard";

type Candidate = {
  anonId: string;
  skills: string[];
  proofScore: number;
};

type PipelineStageProps = {
  title: string;
  candidates: Candidate[];
};

export function PipelineStage({ title, candidates }: PipelineStageProps) {
  return (
    <div className="w-64 bg-gray-50 rounded-lg p-3 mr-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="space-y-2">
        {candidates.map((c) => (
          <CandidateCard key={c.anonId} candidate={c} />
        ))}
      </div>
    </div>
  );
}
