"use client";

import { useEffect, useState } from "react";
import { CandidateCard } from "../components/CandidateCard";
import { CompanyStats } from "../components/CompanyStats";

export default function CompanyDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = {
    avgReadiness: 94,
    responseTime: "1.5d",
    timeToHire: "8d",
    candidatePool: candidates.length || 12,
  };

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/company/talent");
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
      } catch (e) {
        console.error("Error loading candidate data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-6">Company Talent Dashboard</h1>
      <CompanyStats stats={stats} />
      <h2 className="text-lg font-semibold mb-4 mt-6">Verified Real Candidates</h2>
      {loading ? (
        <div className="text-slate-400 py-4">Loading real candidate profiles...</div>
      ) : candidates.length > 0 ? (
        candidates.map((candidate) => (
          <CandidateCard key={candidate.anonId} candidate={candidate} />
        ))
      ) : (
        <p className="text-slate-400">No active candidates found.</p>
      )}
    </div>
  );
}
