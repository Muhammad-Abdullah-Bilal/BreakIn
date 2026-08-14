"use client";

import { useEffect, useState } from "react";
import { JobCard } from "../components/JobCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import Link from "next/link";

export default function JobPostingsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(Array.isArray(data) ? data.map((j: any) => ({
            id: j.id || j._id,
            title: j.title,
            description: j.description || (j.skills ? j.skills.join(", ") : ""),
            postedAt: j.created_at || new Date().toISOString()
          })) : []);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            Active Job Postings
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage corporate openings matched against verified developer proof-of-work.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 shadow-sm">
          <Link href="/company-dashboard">
            <Plus className="w-3.5 h-3.5" />
            Post New Position
          </Link>
        </Button>
      </div>

      {loading ? (
        <CardGridSkeleton count={2} />
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No Active Job Postings"
          description="Create your first position opening to receive automatic matches with top sprint performers."
          actionLabel="Create Job Opening"
          actionHref="/company-dashboard"
        />
      )}
    </div>
  );
}
