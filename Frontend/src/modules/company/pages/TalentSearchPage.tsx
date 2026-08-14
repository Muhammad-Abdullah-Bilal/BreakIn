"use client";

import { useEffect, useState } from "react";
import { CandidateCard } from "../components/CandidateCard";

const ALL_SKILLS = ["React", "TypeScript", "Node.js", "MongoDB", "Python", "FastAPI", "WebSockets"];

export default function TalentSearchPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function searchTalent() {
      try {
        setLoading(true);
        const query = selectedSkill ? `?skill=${encodeURIComponent(selectedSkill)}` : "";
        const res = await fetch(`/api/company/talent${query}`);
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.map((c: any) => ({
            anonId: c.codename || c.id || "Candidate",
            skills: c.skills || [],
            proofScore: c.proofScore || 90,
            trustScore: c.trustScore || 95,
            growth: c.growth || "+25%",
            status: c.status || "Available"
          })));
        }
      } catch (err) {
        console.error("Error searching talent:", err);
      } finally {
        setLoading(false);
      }
    }
    searchTalent();
  }, [selectedSkill]);

  return (
    <div className="max-w-3xl mx-auto py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-6">Real Talent Search</h1>
      <div className="mb-6 flex items-center gap-3">
        <label className="font-medium text-slate-300">Filter by skill:</label>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Skills</option>
          {ALL_SKILLS.map((skill) => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 py-4">Searching MongoDB Atlas talent pool...</div>
      ) : candidates.length > 0 ? (
        candidates.map((candidate) => (
          <CandidateCard key={candidate.anonId} candidate={candidate} />
        ))
      ) : (
        <div className="text-slate-400 py-6">No candidates found matching the selected skill.</div>
      )}
    </div>
  );
}
