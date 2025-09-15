// TalentSearchPage: search/browse candidates

import { useState } from "react";
import { CandidateCard } from "../components/CandidateCard";

const MOCK_CANDIDATES = [
  { anonId: "101", skills: ["React", "TypeScript"], proofScore: 92 },
  { anonId: "102", skills: ["Node.js", "MongoDB"], proofScore: 88 },
  { anonId: "103", skills: ["Python", "FastAPI"], proofScore: 95 },
  { anonId: "104", skills: ["React", "Node.js"], proofScore: 85 },
];

const ALL_SKILLS = ["React", "TypeScript", "Node.js", "MongoDB", "Python", "FastAPI"];

export default function TalentSearchPage() {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const filtered = selectedSkill
    ? MOCK_CANDIDATES.filter((c) => c.skills.includes(selectedSkill))
    : MOCK_CANDIDATES;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Talent Search</h1>
      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by skill:</label>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          {ALL_SKILLS.map((skill) => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>
      </div>
      {filtered.map((candidate) => (
        <CandidateCard key={candidate.anonId} candidate={candidate} />
      ))}
      {filtered.length === 0 && <div className="text-gray-500">No candidates found.</div>}
    </div>
  );
}
