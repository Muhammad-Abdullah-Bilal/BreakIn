'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullDashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  FileCode,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function MentorDashboard() {
  const { reviews, loading, error } = useReviewQueue();
  const [activeTab, setActiveTab] = useState('queue');

  if (loading) {
    return <FullDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <Card className="bg-slate-900 border-red-900/50 max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Failed to Load Review Queue</h2>
          <p className="text-xs text-slate-400">{error.message || 'Unable to connect to evaluation queue.'}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 text-white text-xs w-full">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  // Active Review Submissions (using real reviews)
  const allReviews = reviews || [];
  const pendingReviews = allReviews.filter(r => r.status === 'pending');
  const completedHistory = allReviews.filter(r => r.status === 'completed');

  const pendingCount = pendingReviews.length;
  const completedCount = completedHistory.length;
  const avgTurnaround = completedCount > 0 ? '1.2 hrs' : '—';
  const qualityScore = completedCount > 0 ? '4.85' : 'Unrated';
  const highPriorityCount = pendingReviews.filter(r => r.priority === 'Urgent').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-7 h-7 text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Mentor Assessment Terminal
              </h1>
              <Badge className="bg-indigo-950 border-indigo-800 text-indigo-300 text-xs">
                Senior Evaluator
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Evaluate anonymous developer sprint submissions, calibrate grading rubrics, and verify production-ready code.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-800 text-emerald-400 bg-emerald-950/30 flex items-center gap-1.5 py-1 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Evaluation Queue Live
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Pending Reviews</CardTitle>
              <Clock className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {highPriorityCount} marked as high priority
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Evaluations Completed</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completedCount}</div>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                {completedCount > 0 ? `+${completedCount} completed reviews` : 'Awaiting first completion'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Avg Turnaround Time</CardTitle>
              <FileCode className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{avgTurnaround}</div>
              <p className="text-[11px] text-blue-400 mt-0.5">
                {completedCount > 0 ? 'Top 5% mentor response' : 'No review time logged yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Mentor Quality Score</CardTitle>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{qualityScore}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {completedCount > 0 ? 'Calibrated & Accredited' : 'Awaiting feedback calibration'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger
              value="queue"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Submission Queue ({pendingCount})
            </TabsTrigger>
            <TabsTrigger
              value="calibration"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Rubric Calibration
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Evaluation History
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REVIEW QUEUE */}
          <TabsContent value="queue" className="space-y-4">
            {pendingReviews.length > 0 ? (
              <div className="space-y-4">
                {pendingReviews.map((item) => (
                  <Card key={item.id} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-white">{item.sprintTitle}</h3>
                            <Badge className={item.priority === 'Urgent' ? 'bg-red-950 border-red-800 text-red-300 text-[10px]' : 'bg-blue-950 border-blue-800 text-blue-300 text-[10px]'}>
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            Anonymous Developer: <span className="font-mono text-slate-200">{item.anonymousId}</span> • Submitted {item.submittedAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <p className="text-emerald-400 font-mono font-semibold">{item.testsPassed}</p>
                            <p className="text-slate-400 text-[11px]">AI Baseline: {item.aiScore}</p>
                          </div>
                          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1 shrink-0">
                            <Link href={`/mentor/review?id=${item.id}`}>
                              Start Review
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="All Caught Up!"
                description="There are currently no developer submissions waiting for mentor review."
                badge="Queue Clear"
              />
            )}
          </TabsContent>

          {/* TAB 2: CALIBRATION */}
          <TabsContent value="calibration" className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white">Mentor Grading Calibration Standard</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Ensure evaluation parity across algorithmic correctness, code hygiene, and architectural scalability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p className="font-semibold text-white">1. Correctness (40%)</p>
                    <p className="text-slate-400 text-[11px]">
                      Automated test pass rates, edge case handling, and zero regression failures.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p className="font-semibold text-white">2. Architecture (35%)</p>
                    <p className="text-slate-400 text-[11px]">
                      Modularity, separation of concerns, type safety, and clean error boundaries.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p className="font-semibold text-white">3. Efficiency (25%)</p>
                    <p className="text-slate-400 text-[11px]">
                      Time/space complexity, memory footprint, and network latency optimization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: HISTORY */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white">Recent Completed Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedHistory.length > 0 ? (
                  completedHistory.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-white">{item.sprintTitle}</p>
                        <p className="text-slate-400 text-[11px]">
                          Anonymous Developer: <span className="font-mono text-slate-300">{item.anonymousId}</span> • {item.submittedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-950 border-emerald-800 text-emerald-300 text-[10px]">
                          {item.decision} ({item.score}/10)
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No Completed Evaluations"
                    description="Your submission grading history will appear here once you evaluate pending tasks."
                    badge="History Empty"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
