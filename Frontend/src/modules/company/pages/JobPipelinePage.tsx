"use client";

import { useEffect, useState } from "react";
import { PipelineStage } from "../components/PipelineStage";

export default function JobPipelinePage() {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPipeline() {
      try {
        const res = await fetch("/api/company/pipeline");
        if (res.ok) {
          const data = await res.json();
          setStages(data.map((s: any) => ({
            title: s.title,
            candidates: (s.candidates || []).map((c: any) => ({
              anonId: c.codename || c.id || "Candidate",
              skills: c.skills || [],
              proofScore: c.proofScore || 90
            }))
          })));
        }
      } catch (err) {
        console.error("Error fetching pipeline:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPipeline();
  }, []);

  return (
    <div className="max-w-full mx-auto py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-6">Live Hiring Pipeline</h1>
      {loading ? (
        <div className="text-slate-400 py-4">Loading pipeline stages...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <PipelineStage key={stage.title} title={stage.title} candidates={stage.candidates} />
          ))}
        </div>
      )}
    </div>
  );
}
