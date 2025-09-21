"use client";

// ProofOfWorkPage: summary view of proof-of-work

import { ProofBadge } from "../components/ProofBadge";
import { useProofOfWork } from "../hooks/useProofOfWork";

export default function ProofOfWorkPage({ userId }: { userId?: string }) {
  const { data: proof } = useProofOfWork(userId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold">Proof of Work</h1>
      <p className="text-gray-600">All validated sprints and submissions</p>

      {proof?.sprints.map((sprint) => (
        <div key={sprint.id} className="p-4 bg-white shadow rounded-xl">
          <h2 className="font-semibold">{sprint.title}</h2>
          <p>Score: {sprint.score}</p>
          <ProofBadge verified={sprint.verified} />
        </div>
      ))}
    </div>
  );
}
