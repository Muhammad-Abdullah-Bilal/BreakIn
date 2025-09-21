"use client";

// WorkspaceDashboard: landing page for dev workspace
import { SprintCard } from "../components/SprintCard";
import { useSprints } from "../hooks/useSprints";

export default function WorkspaceDashboard() {
  const { sprints } = useSprints();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Active Sprints</h1>
      {sprints.map((sprint) => (
        <SprintCard key={sprint.id} sprint={sprint} />
      ))}
    </div>
  );
}
