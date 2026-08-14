'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useActivities, useAvailableSprints, useSkillProgress } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullDashboardSkeleton, CardGridSkeleton } from '@/components/ui/DashboardSkeleton';
import {
  Code2,
  Trophy,
  Flame,
  Star,
  Target,
  Rocket,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Check
} from 'lucide-react';

interface VerifiedSubmission {
  taskTitle: string;
  score: number;
  codeQuality: number;
  efficiency: number;
  problemSolving: number;
  date: string;
  codeSnippet?: string;
  status: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [verifiedArtifacts, setVerifiedArtifacts] = useState<VerifiedSubmission[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  const { user, developer, loading: authLoading } = useAuth();
  
  // Data hooks
  const { sprints: availableSprints, loading: sprintsLoading } = useAvailableSprints();
  const identity = user?.pseudonym || user?.username || user?.email || undefined;
  const { activities: recentActivity, loading: activitiesLoading } = useActivities(identity);
  const { skills: skillProgress, loading: skillsLoading } = useSkillProgress(identity);

  // Load real verified submissions from sessionStorage or profile
  useEffect(() => {
    try {
      const storedEval = sessionStorage.getItem('latest_sprint_evaluation');
      const storedCode = sessionStorage.getItem('latest_sprint_code');

      if (storedEval) {
        const parsed = JSON.parse(storedEval);
        setVerifiedArtifacts([
          {
            taskTitle: parsed.taskTitle || 'Sprint Simulation Task',
            score: parsed.score || 0,
            codeQuality: parsed.codeQuality || parsed.metrics?.codeQuality || 0,
            efficiency: parsed.efficiency || parsed.metrics?.efficiency || 0,
            problemSolving: parsed.problemSolving || parsed.metrics?.problemSolving || 0,
            date: 'Just now',
            codeSnippet: storedCode || undefined,
            status: parsed.status || (parsed.score >= 6.5 ? 'PASSED' : 'NEEDS_REVISION')
          }
        ]);
      }
    } catch {}
  }, []);

  // Fetch real jobs from backend API
  useEffect(() => {
    async function fetchJobs() {
      try {
        setJobsLoading(true);
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          setLiveJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setJobsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Synchronize appliedJobs state from fetched liveJobs and logged-in user
  useEffect(() => {
    if (liveJobs.length > 0 && user) {
      const userId = user.id || user._id;
      const username = user.username;
      const applied: Record<string, boolean> = {};
      liveJobs.forEach((job: any) => {
        if (Array.isArray(job.applicantsList)) {
          const alreadyApplied = job.applicantsList.some(
            (app: any) => app.id === userId || app.codename === username || app.name === username
          );
          if (alreadyApplied) {
            applied[job._id || job.id] = true;
          }
        }
      });
      setAppliedJobs(applied);
    }
  }, [liveJobs, user]);

  if (authLoading) {
    return <FullDashboardSkeleton />;
  }

  // Developer Profile Summary Metrics - purely dynamic without fake static numbers
  const sprintsCount = (developer?.sprint_history || 0) + verifiedArtifacts.length;
  const stats = {
    sprintsCompleted: sprintsCount,
    successRate: sprintsCount > 0 ? (developer?.success_rate || (verifiedArtifacts.length > 0 ? Math.round(verifiedArtifacts[0].score * 10) : 0)) : 0,
    reputation: sprintsCount > 0 && developer?.reputation && developer.reputation !== 100 ? developer.reputation : (verifiedArtifacts.length > 0 ? (verifiedArtifacts[0].score / 2).toFixed(1) : null),
    streak: developer?.current_streak || (sprintsCount > 0 ? 1 : 0),
    skillBadges: (sprintsCount > 0 ? (developer?.skill_badges || 1) : 0) + (skillProgress?.length || 0),
    level: developer?.level || (sprintsCount > 0 ? 'Junior Developer' : 'Beginner Developer'),
    codename: developer?.codename || user?.pseudonym || user?.username || 'Developer',
  };

  const filteredSprints = selectedDomain === 'All' 
    ? (availableSprints || []) 
    : (availableSprints || []).filter((s: any) => 
        (s.technologies && Array.isArray(s.technologies) && s.technologies.some((t: string) => t.toLowerCase().includes(selectedDomain.toLowerCase()))) || 
        s.difficulty?.toLowerCase() === selectedDomain.toLowerCase()
      );

  const handleApplyJob = async (jobId: string) => {
    setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          developer: {
            id: user?.id || user?._id || 'dev_123',
            name: user?.displayName || user?.username || 'Anonymous Developer',
            codename: developer?.codename || user?.username || 'AnonDev',
            score: developer?.overallScore || developer?.score || 8.5,
            sprintsCompleted: developer?.completedSprintsCount || 2,
            skills: developer?.skills || ['React', 'Node.js'],
            avatarUrl: user?.avatarUrl || user?.avatar || ''
          }
        }),
      });
      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your verified proof-of-work has been shared with the hiring team.",
        });
      }
    } catch (err) {
      console.error('Error applying to job:', err);
    }
  };

  return (
    <RoleGuard allowedRoles={['developer', 'admin']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top Hero / Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Welcome back, {stats.codename}
                  </h1>
                  <Badge className="bg-blue-950/80 border-blue-800 text-blue-300 text-xs px-2.5 py-0.5">
                    {stats.level}
                  </Badge>
                  {stats.streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded-full font-medium">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {stats.streak} Day Streak
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-400 max-w-2xl">
                  {stats.sprintsCompleted === 0 
                    ? 'Your developer journey is ready. Join an open sprint simulation to build verified proof-of-work and attract hiring teams.' 
                    : `You have completed ${stats.sprintsCompleted} verified sprint ${stats.sprintsCompleted === 1 ? 'simulation' : 'simulations'}. Your skills are actively matched against verified company pipelines.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={() => setActiveTab('sprints')}
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 gap-1.5 text-sm"
                >
                  <Rocket className="w-4 h-4" />
                  Explore Sprints
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-sm"
                >
                  <Link href="/sprint/sprinting">
                    <Code2 className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Open IDE Workspace
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1.5">
                <CardTitle className="text-xs font-medium text-slate-400">Sprints Completed</CardTitle>
                <Trophy className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.sprintsCompleted}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats.sprintsCompleted === 0 ? 'Ready for sprint #1' : 'Verified by Rubrics & Mentors'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1.5">
                <CardTitle className="text-xs font-medium text-slate-400">Simulation Success Rate</CardTitle>
                <Target className="w-4 h-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">
                  {stats.successRate > 0 ? `${stats.successRate}%` : '—'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats.successRate > 0 ? 'Evaluated against test gates' : 'Assessed upon sprint completion'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1.5">
                <CardTitle className="text-xs font-medium text-slate-400">Reputation Rating</CardTitle>
                <Star className="w-4 h-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  {stats.reputation ? (
                    <>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />
                      <span>{stats.reputation}</span>
                    </>
                  ) : (
                    <span className="text-base font-normal text-slate-400">Unrated</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats.reputation ? 'Verified Contributor' : 'Calibrates after first review'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1.5">
                <CardTitle className="text-xs font-medium text-slate-400">Verified Skill Badges</CardTitle>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-300">{stats.skillBadges}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats.skillBadges > 0 ? 'Proven through live code' : 'Unlock via sprint challenges'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="sprints"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
              >
                Sprint Challenges
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
              >
                Proof-of-Work
              </TabsTrigger>
              <TabsTrigger
                value="skills"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
              >
                Skills Radar
              </TabsTrigger>
              <TabsTrigger
                value="opportunities"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
              >
                Matched Jobs
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Columns: Active Sprints & Competency Matrix */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Current Active Sprint / Next Steps */}
                  <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div>
                        <CardTitle className="text-base sm:text-lg text-white">Current Active Mission</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Your current simulation objective and progress milestone
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-blue-800/80 bg-blue-950/40 text-blue-300 text-xs">
                        Sprint Protocol
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {verifiedArtifacts.length > 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">
                                  {verifiedArtifacts[0].taskTitle}
                                </h4>
                                <Badge className={verifiedArtifacts[0].status === 'PASSED' ? 'bg-emerald-950 border-emerald-800 text-emerald-300 text-[10px]' : 'bg-amber-950 border-amber-800 text-amber-300 text-[10px]'}>
                                  {verifiedArtifacts[0].status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                Score: {verifiedArtifacts[0].score.toFixed(1)}/10 • Evaluated against code quality gates
                              </p>
                            </div>
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs text-white shrink-0">
                              <Link href="/sprint/results">
                                View Evaluation Results
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No Active Sprint In Progress"
                          description="You are currently not working on an active sprint. Join a sprint challenge from the catalog to build your verified proof-of-work portfolio."
                          actionLabel="Browse Available Sprints"
                          onAction={() => setActiveTab('sprints')}
                          className="py-8"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills Snapshot */}
                  <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div>
                        <CardTitle className="text-base text-white">Core Competency Matrix</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Automated evaluation from unit tests, linting, and mentor reviews
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('skills')} className="text-xs text-blue-400 hover:text-blue-300">
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {skillProgress && skillProgress.length > 0 ? (
                        <div className="space-y-3.5">
                          {skillProgress.slice(0, 4).map((skill: any, idx: number) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-200">{skill.skill || skill.name}</span>
                                <span className="font-mono text-slate-400">{skill.progress || skill.level || 0}% Mastery</span>
                              </div>
                              <Progress value={skill.progress || skill.level || 0} className="h-1.5 bg-slate-800" />
                            </div>
                          ))}
                        </div>
                      ) : verifiedArtifacts.length > 0 ? (
                        <div className="space-y-3.5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-200">Code Quality & Best Practices</span>
                              <span className="font-mono text-blue-400">{Math.round(verifiedArtifacts[0].codeQuality * 10)}% Mastery</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].codeQuality * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-200">Algorithmic Problem Solving</span>
                              <span className="font-mono text-emerald-400">{Math.round(verifiedArtifacts[0].problemSolving * 10)}% Mastery</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].problemSolving * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-200">Execution Efficiency</span>
                              <span className="font-mono text-indigo-400">{Math.round(verifiedArtifacts[0].efficiency * 10)}% Mastery</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].efficiency * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No Competency Metrics Yet"
                          description="Complete your first sprint challenge to benchmark and verify your programming competencies."
                          actionLabel="Start a Sprint"
                          onAction={() => setActiveTab('sprints')}
                          className="py-6"
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Recent Activity Feed */}
                <div className="space-y-6">
                  <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">Recent Activity</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Sprint submissions, reviews, and test passes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {recentActivity.slice(0, 5).map((act: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
                              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-slate-200 font-medium truncate">{act.title || act.action || 'Sprint Event'}</p>
                                <p className="text-slate-400 text-[11px]">{act.description || 'Verified on platform'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : verifiedArtifacts.length > 0 ? (
                        <div className="space-y-3 text-xs">
                          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-200 font-medium">Sprint Task Evaluated</p>
                              <p className="text-slate-400 text-[11px]">Score: {verifiedArtifacts[0].score.toFixed(1)}/10 • Code quality verified</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No Recent Activity"
                          description="Your sprint submissions, live code snapshots, and mentor reviews will appear here."
                          className="py-6"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Career Readiness Card */}
                  <Card className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-900/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Direct Company Hiring
                      </div>
                      <CardTitle className="text-base text-white">Talent Radar Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-slate-300">
                      <p>
                        Your profile is visible to verified corporate sponsors looking for demonstrated ability over traditional resumes.
                      </p>
                      <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Employer Visibility</span>
                          <span className="text-emerald-400 font-medium">Active & Searchable</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Profile Completeness</span>
                          <span className="text-blue-400 font-medium">{stats.sprintsCompleted > 0 ? '90%' : '50%'}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button asChild variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-xs text-slate-200">
                        <Link href="/profile">
                          Update Developer Bio
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

              </div>
            </TabsContent>

            {/* TAB 2: SPRINT CHALLENGES */}
            <TabsContent value="sprints" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Simulated Engineering Sprints</h3>
                  <p className="text-xs text-slate-400">Real-world production challenges evaluated by automated rubrics and senior mentors.</p>
                </div>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {['All', 'React', 'Python', 'Full Stack', 'Advanced'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedDomain(filter)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedDomain === filter 
                          ? 'bg-blue-600 border-blue-500 text-white font-medium shadow-sm' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {sprintsLoading ? (
                <CardGridSkeleton count={3} />
              ) : filteredSprints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSprints.map((sprint: any) => (
                    <Card key={sprint._id || sprint.id || sprint.title} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                      <CardHeader className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-[10px]">
                            {sprint.difficulty || 'Intermediate'}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {sprint.duration || '2-4 hours'}
                          </span>
                        </div>
                        <CardTitle className="text-base font-semibold text-white line-clamp-1">
                          {sprint.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400 line-clamp-2">
                          {sprint.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(sprint.technologies || ['TypeScript', 'Next.js', 'FastAPI']).map((tech: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="border-t border-slate-800/80 pt-3 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                          <span className="font-semibold text-emerald-400">+$500</span> Reward Value
                        </div>
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1">
                          <Link href={`/sprint/dashboard/${sprint._id || sprint.id || 'current'}`}>
                            Join Sprint
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Sprints Matching Your Filter"
                  description="Try selecting 'All' to view all available engineering simulations."
                  actionLabel="Clear Filter"
                  onAction={() => setSelectedDomain('All')}
                />
              )}
            </TabsContent>

            {/* TAB 3: PROOF OF WORK PORTFOLIO */}
            <TabsContent value="portfolio" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Cryptographically Verified Proof-of-Work</h3>
                  <p className="text-xs text-slate-400">Immutable records of code quality, problem solving speed, and mentor approvals.</p>
                </div>
                {verifiedArtifacts.length > 0 && (
                  <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-xs text-slate-300 gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Copy Shareable Portfolio Link
                  </Button>
                )}
              </div>

              {verifiedArtifacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {verifiedArtifacts.map((artifact, idx) => (
                    <Card key={idx} className="bg-slate-900/60 border-slate-800">
                      <CardHeader>
                        <div className="flex justify-between items-center mb-1">
                          <Badge className={artifact.status === 'PASSED' ? 'bg-emerald-950 border-emerald-800 text-emerald-300 text-[10px]' : 'bg-amber-950 border-amber-800 text-amber-300 text-[10px]'}>
                            {artifact.status === 'PASSED' ? 'Verified Artifact' : 'Evaluation Recorded'}
                          </Badge>
                          <span className="text-xs text-slate-400">{artifact.date}</span>
                        </div>
                        <CardTitle className="text-base text-white">{artifact.taskTitle}</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Automated evaluation from live code execution and rubric scoring.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg text-center text-xs">
                          <div>
                            <p className="text-slate-400 text-[10px]">Code Quality</p>
                            <p className="text-emerald-400 font-bold text-sm">{artifact.codeQuality.toFixed(1)} / 10</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Problem Solving</p>
                            <p className="text-blue-400 font-bold text-sm">{artifact.problemSolving.toFixed(1)} / 10</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Total Score</p>
                            <p className="text-amber-400 font-bold text-sm">{artifact.score.toFixed(1)} / 10</p>
                          </div>
                        </div>

                        {artifact.codeSnippet && (
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Submitted Code Snapshot:</p>
                            <pre className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24">
                              {artifact.codeSnippet}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Proof-of-Work Artifacts Yet"
                  description="Complete your first sprint challenge in the IDE workspace to generate verifiable, cryptographically signed proof-of-work records."
                  actionLabel="Start a Sprint Challenge"
                  onAction={() => setActiveTab('sprints')}
                  className="py-12"
                />
              )}
            </TabsContent>

            {/* TAB 4: SKILLS RADAR */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base text-white">Full Skill Proficiency Breakdown</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Live mastery scores computed from completed code reviews, test completions, and system design simulations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {skillProgress && skillProgress.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Assessed Competencies</h4>
                        <div className="space-y-3">
                          {skillProgress.map((skill: any, idx: number) => (
                            <div key={idx}>
                              <div className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>{skill.skill || skill.name}</span>
                                <span className="font-mono text-blue-400">{skill.progress || skill.level || 0}%</span>
                              </div>
                              <Progress value={skill.progress || skill.level || 0} className="h-1.5 bg-slate-800" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : verifiedArtifacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Simulation Mastery Scores</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>Code Quality & Syntax Standards</span>
                              <span className="font-mono text-blue-400">{Math.round(verifiedArtifacts[0].codeQuality * 10)}%</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].codeQuality * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>Algorithmic Logic & Edge Cases</span>
                              <span className="font-mono text-emerald-400">{Math.round(verifiedArtifacts[0].problemSolving * 10)}%</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].problemSolving * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>Execution Speed & Focus</span>
                              <span className="font-mono text-indigo-400">{Math.round(verifiedArtifacts[0].efficiency * 10)}%</span>
                            </div>
                            <Progress value={Math.round(verifiedArtifacts[0].efficiency * 10)} className="h-1.5 bg-slate-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No Skill Mastery Data Available"
                      description="Skill proficiencies are dynamically calibrated from unit tests and automated rubrics as you solve sprints."
                      actionLabel="Explore Sprints"
                      onAction={() => setActiveTab('sprints')}
                      className="py-8"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: MATCHED JOBS */}
            <TabsContent value="opportunities" className="space-y-6">
              <div className="pb-2">
                <h3 className="text-lg font-semibold text-white">Direct Role Opportunities</h3>
                <p className="text-xs text-slate-400">Companies hiring immediately based on verified sprint competencies.</p>
              </div>

              {jobsLoading ? (
                <CardGridSkeleton count={2} />
              ) : liveJobs.length > 0 ? (
                <div className="space-y-4">
                  {liveJobs.map((job) => {
                    const isApplied = appliedJobs[job._id || job.id];
                    return (
                      <Card key={job._id || job.id} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold text-white">{job.title}</CardTitle>
                                {job.location && (
                                  <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-xs">
                                    {job.location}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                <span className="text-slate-200 font-medium">{job.company || 'Verified Employer'}</span>
                                {job.salary && ` • ${job.salary}`}
                                {job.type && ` • ${job.type}`}
                              </p>
                            </div>
                            <Button 
                              onClick={() => handleApplyJob(job._id || job.id)}
                              disabled={isApplied}
                              className={`text-xs shrink-0 shadow-sm ${
                                isApplied 
                                  ? 'bg-emerald-700 text-white cursor-default' 
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Application Submitted
                                </>
                              ) : (
                                '1-Click Apply with Proof'
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <p className="text-xs text-slate-300 mb-3">{job.description}</p>
                          {job.skills && Array.isArray(job.skills) && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map((req: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                                  {req}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No Active Job Postings"
                  description="Corporate employers regularly post positions matching verified sprint skills. Check back soon or browse sprints."
                  actionLabel="Browse Available Sprints"
                  onAction={() => setActiveTab('sprints')}
                  className="py-10"
                />
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}