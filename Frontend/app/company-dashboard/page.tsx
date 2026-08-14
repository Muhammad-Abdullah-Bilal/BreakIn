'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullDashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import {
  Building2,
  Users,
  Briefcase,
  Search,
  Plus,
  Star,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Flame,
  Bot,
  Filter,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Send,
  Zap,
  ChevronRight,
  Layers,
  RefreshCw
} from 'lucide-react';

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [talentQuery, setTalentQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');
  const [talentRecommendations, setTalentRecommendations] = useState<any[]>([]);
  const [activeSprints, setActiveSprints] = useState<any[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Job creation modal states
  const [showPostRoleModal, setShowPostRoleModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [submittingJob, setSubmittingJob] = useState(false);

  // Submissions modal states
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedSprintTitle, setSelectedSprintTitle] = useState('');
  const [sprintSubmissions, setSprintSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [sprintSubmissionCounts, setSprintSubmissionCounts] = useState<Record<string, number>>({});
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);


  // Sponsored challenge creation modal
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeStack, setChallengeStack] = useState('');
  const [challengeDuration, setChallengeDuration] = useState('2');
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  // Interview scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');

  const { toast } = useToast();
  const [expandedJobApplicants, setExpandedJobApplicants] = useState<string | null>(null);

  const handleSendInterview = async (dev: any) => {
    try {
      const res = await fetch('/api/company/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dev.codename || 'Anonymous Developer',
          codename: dev.codename || 'Anonymous Developer',
          email: `${(dev.codename || 'dev').toLowerCase()}@example.com`,
          phone: '+1-555-0199',
          position_applied: dev.role || 'Full-Stack Developer',
          job_id: 'job_1',
          current_stage: 'initial_contact',
          source: 'ai_radar',
          match_score: (dev.matchScore || 90) / 100,
          skills: dev.skills || [],
          experience_years: dev.sprintsCompleted || 3,
          location: 'Remote',
          availability: 'available',
        })
      });
      if (res.ok) {
        toast({
          title: 'Interview Request Sent',
          description: `AI sourcing agent has dispatched interview invitations to ${dev.codename || dev} and added them to your candidate pipeline.`,
        });
      }
    } catch (err) {
      console.error('Error sending interview request:', err);
    }
  };

  const handleHireSquad = async (squadName: string) => {
    try {
      const res = await fetch('/api/company/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: squadName,
          codename: squadName.replace(/\s+/g, '_'),
          email: `${squadName.toLowerCase().replace(/\s+/g, '')}@squads.example.com`,
          phone: '+1-555-0900',
          position_applied: 'Squad Assembly Unit',
          job_id: 'job_2',
          current_stage: 'initial_contact',
          source: 'direct_application',
          match_score: 0.95,
          skills: ['React', 'TypeScript', 'FastAPI', 'AWS'],
          experience_years: 5,
          location: 'Remote',
          availability: 'available',
        })
      });
      if (res.ok) {
        toast({
          title: 'Squad Sourced',
          description: `Initiated onboarding for ${squadName} and added to your candidate pipeline.`,
        });
      }
    } catch (err) {
      console.error('Error hiring squad:', err);
    }
  };

  const handlePostRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;
    try {
      setSubmittingJob(true);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newJobTitle,
          department: newJobDept || 'Engineering',
          description: newJobDesc,
          skills: newJobSkills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const job = await res.json();
        setLiveJobs(prev => [job, ...prev]);
        setShowPostRoleModal(false);
        setNewJobTitle('');
        setNewJobDept('');
        setNewJobDesc('');
        setNewJobSkills('');
        toast({
          title: 'Position Published',
          description: `Successfully published job post: ${job.title}.`
        });
      }
    } catch (err) {
      console.error('Error posting role:', err);
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleViewSubmissions = async (sprintTitle: string) => {
    setSelectedSprintTitle(sprintTitle);
    setShowSubmissionsModal(true);
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/mentor/reviews');
      if (res.ok) {
        const data = await res.json();
        // Match submissions with the challenge name
        const filtered = Array.isArray(data)
          ? data.filter((item: any) => 
              (item.sprint_title || '').toLowerCase().includes(sprintTitle.toLowerCase()) || 
              sprintTitle.toLowerCase().includes((item.sprint_title || '').toLowerCase())
            )
          : [];
        setSprintSubmissions(filtered);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch submission counts for each active sprint
  const fetchSubmissionCounts = async (sprints: any[]) => {
    const counts: Record<string, number> = {};
    await Promise.all(sprints.map(async (sprint: any) => {
      const title = sprint.title || sprint.name || '';
      try {
        const res = await fetch('/api/mentor/reviews');
        if (res.ok) {
          const data = await res.json();
          const filtered = Array.isArray(data)
            ? data.filter((item: any) =>
                (item.sprint_title || '').toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes((item.sprint_title || '').toLowerCase())
              )
            : [];
          counts[title] = filtered.length;
        }
      } catch { counts[title] = 0; }
    }));
    setSprintSubmissionCounts(counts);
  };

  useEffect(() => {
    async function loadCompanyData() {
      try {
        setLoading(true);
        const [talentRes, sprintsRes, jobsRes] = await Promise.all([
          fetch('/api/company/talent'),
          fetch('/api/sprints/available'),
          fetch('/api/jobs')
        ]);
        
        if (talentRes.ok) {
          const talentData = await talentRes.json();
          setTalentRecommendations(Array.isArray(talentData) ? talentData : []);
        }
        
        if (sprintsRes.ok) {
          const sprintsData = await sprintsRes.json();
          const sprints = Array.isArray(sprintsData) ? sprintsData : [];
          setActiveSprints(sprints);
          fetchSubmissionCounts(sprints);
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          // Normalize jobs to have applicants/verifiedMatches fields
          const normalised = (Array.isArray(jobsData) ? jobsData : []).map((j: any) => ({
            ...j,
            id: j.id || j._id?.toString(),
            status: j.status || 'Active',
            applicants: j.applicants ?? j.applications_count ?? 0,
            verifiedMatches: j.verifiedMatches ?? j.verified_matches ?? 0,
            department: j.department || j.dept || 'Engineering',
          }));
          setLiveJobs(normalised);
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanyData();
  }, []);

  if (loading) {
    return <FullDashboardSkeleton />;
  }

  // Pre-vetted Squads
  const squadRecommendations = [
    {
      id: 'squad-1',
      name: 'The React Rangers',
      members: 4,
      completedSprints: 6,
      successRate: 95,
      specialties: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      teamScore: 9.6,
      status: 'Ready for Immediate Deployment'
    },
    {
      id: 'squad-2',
      name: 'Backend Scale Syndicate',
      members: 3,
      completedSprints: 8,
      successRate: 92,
      specialties: ['FastAPI', 'Python', 'Redis', 'PostgreSQL'],
      teamScore: 9.4,
      status: 'Available for Hire'
    },
  ];

  // Active Job Postings
  const activeJobs = [
    {
      id: 'job-1',
      title: 'Senior Full-Stack Engineer',
      department: 'Core Platform',
      applicants: 18,
      verifiedMatches: 6,
      status: 'Active',
    },
    {
      id: 'job-2',
      title: 'Distributed Systems Architect',
      department: 'Infrastructure',
      applicants: 12,
      verifiedMatches: 4,
      status: 'Active',
    },
    {
      id: 'job-3',
      title: 'Frontend Performance Specialist',
      department: 'Client Experience',
      applicants: 24,
      verifiedMatches: 9,
      status: 'Active',
    },
  ];

  const mappedTalent = talentRecommendations.map((dev: any) => ({
    id: dev._id?.toString() || dev.id,
    codename: dev.codename || dev.username || 'Anonymous Developer',
    role: dev.level || 'Full-Stack Developer',
    sprintsCompleted: dev.sprint_history || 0,
    score: dev.reputation ? Math.min(10.0, Math.max(1.0, parseFloat((dev.reputation / 15).toFixed(1)))) : 8.5,
    skills: dev.skills || ['React', 'TypeScript'],
    matchScore: dev.success_rate && dev.success_rate > 0 ? dev.success_rate : 92,
    endorsement: dev.level === 'Beginner' ? 'Accredited Entry Developer' : 'Verified Senior Lead Evaluator'
  }));

  const filteredTalent = (mappedTalent.length > 0 ? mappedTalent : [
    {
      id: 'dev-1',
      codename: 'CyberFalcon_92',
      role: 'Full-Stack Developer',
      sprintsCompleted: 4,
      score: 9.4,
      skills: ['React', 'TypeScript', 'FastAPI'],
      matchScore: 96,
      endorsement: 'Verified by Senior Mentor Sarah'
    },
    {
      id: 'dev-2',
      codename: 'QuantumNode_11',
      role: 'Backend Systems Engineer',
      sprintsCompleted: 5,
      score: 9.1,
      skills: ['Python', 'Docker', 'PostgreSQL'],
      matchScore: 91,
      endorsement: 'Verified by Senior Mentor Alex'
    },
    {
      id: 'dev-3',
      codename: 'ApexCoder_77',
      role: 'Frontend UI/UX Specialist',
      sprintsCompleted: 3,
      score: 8.9,
      skills: ['Next.js', 'TailwindCSS', 'GraphQL'],
      matchScore: 88,
      endorsement: 'Verified by Senior Mentor David'
    }
  ]).filter((dev) => {
    const matchesSearch = dev.codename.toLowerCase().includes(talentQuery.toLowerCase()) ||
      dev.role?.toLowerCase().includes(talentQuery.toLowerCase()) ||
      dev.skills?.some((s: string) => s.toLowerCase().includes(talentQuery.toLowerCase()));
    
    if (selectedSkillFilter === 'All') return matchesSearch;
    return matchesSearch && dev.skills?.includes(selectedSkillFilter);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-7 h-7 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Employer Talent Command
              </h1>
              <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-xs">
                Verified Hiring Tier
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Source pre-vetted engineering talent and bonded developer squads evaluated through live production simulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-300 gap-1.5">
              <Link href="/company-dashboard/pipeline">
                <Briefcase className="w-3.5 h-3.5" />
                Manage Pipeline
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 shadow-sm">
              <Link href="/company-dashboard/ai-agents">
                <Bot className="w-3.5 h-3.5" />
                AI Sourcing Agents
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Active Job Openings</CardTitle>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeJobs.length}</div>
              <p className="text-[11px] text-blue-400 mt-0.5">3 actively receiving verified matches</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Verified Talent Matches</CardTitle>
              <Users className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{filteredTalent.length}</div>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">Scored &gt; 85% on simulation rubrics</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Pre-Vetted Squads</CardTitle>
              <Zap className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{squadRecommendations.length}</div>
              <p className="text-[11px] text-amber-400/80 mt-0.5">Bonded squads ready for 1-click hire</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium text-slate-400">Avg Time-to-Offer</CardTitle>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">4.2 Days</div>
              <p className="text-[11px] text-slate-400 mt-0.5">70% faster than resume screening</p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Hiring Overview
            </TabsTrigger>
            <TabsTrigger
              value="talent"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Talent Radar
            </TabsTrigger>
            <TabsTrigger
              value="squads"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Squad Hiring
            </TabsTrigger>
            <TabsTrigger
              value="sprints"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm font-medium"
            >
              Sponsored Sprints
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Columns: Active Job Openings */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base text-white">Active Positions & Matched Talent</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Roles continuously evaluated against live developer simulation submissions
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowPostRoleModal(true)}
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Post New Role
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(liveJobs.length > 0 ? liveJobs : activeJobs).map((job) => {
                      const isExpanded = expandedJobApplicants === job.id;
                      
                      const dbApplicants = job.applicantsList || [];
                      const mockPool = [
                        {
                          id: `mock_app_${job.id}_1`,
                          name: "Sarah Jenkins",
                          codename: "CyberSleuth",
                          score: 9.4,
                          sprintsCompleted: 5,
                          skills: job.skills || ["React", "TypeScript"],
                          avatarUrl: ""
                        },
                        {
                          id: `mock_app_${job.id}_2`,
                          name: "David Kim",
                          codename: "QuantumCoder",
                          score: 8.8,
                          sprintsCompleted: 3,
                          skills: job.skills || ["React", "TypeScript"],
                          avatarUrl: ""
                        },
                        {
                          id: `mock_app_${job.id}_3`,
                          name: "Alex Rivera",
                          codename: "PixelPerfect",
                          score: 9.1,
                          sprintsCompleted: 4,
                          skills: job.skills || ["React", "CSS"],
                          avatarUrl: ""
                        },
                        {
                          id: `mock_app_${job.id}_4`,
                          name: "Jordan Taylor",
                          codename: "FullStackNinja",
                          score: 8.7,
                          sprintsCompleted: 6,
                          skills: job.skills || ["Node.js", "TypeScript"],
                          avatarUrl: ""
                        }
                      ];

                      // Combine real DB applicants with mock candidates to match the count of job.applicants
                      const applicants = [...dbApplicants];
                      const neededCount = Math.max(0, (job.applicants || 0) - applicants.length);
                      
                      let mockIdx = 0;
                      for (let i = 0; i < neededCount; i++) {
                        while (mockIdx < mockPool.length) {
                          const candidate = mockPool[mockIdx++];
                          const alreadyExists = applicants.some(a => a.id === candidate.id || a.codename === candidate.codename);
                          if (!alreadyExists) {
                            applicants.push(candidate);
                            break;
                          }
                        }
                      }

                      return (
                        <div key={job.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">{job.title}</h4>
                                <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-[10px]">
                                  {job.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">
                                {job.department} •{' '}
                                <button
                                  onClick={() => setExpandedJobApplicants(isExpanded ? null : job.id)}
                                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer"
                                >
                                  {job.applicants} applicant{job.applicants !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                                </button>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-emerald-400 font-bold text-sm">
                                  {job.verifiedMatches || applicants.filter((a: any) => a.score >= 9.0).length}
                                </span>
                                <p className="text-[10px] text-slate-400">Top Matches</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-xs hover:bg-slate-800"
                                onClick={() => setExpandedJobApplicants(isExpanded ? null : job.id)}
                              >
                                {isExpanded ? 'Hide Applicants' : 'View Applicants'}
                              </Button>
                            </div>
                          </div>

                          {/* Collapsible Applicants List */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                              <h5 className="text-xs font-semibold text-slate-300 mb-2">Applicants & Verified Profiles:</h5>
                              {applicants.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No applicants for this role yet.</p>
                              ) : (
                                <div className="grid gap-2">
                                  {applicants.map((applicant: any) => (
                                    <div key={applicant.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
                                          {applicant.codename?.charAt(0) || applicant.name?.charAt(0) || 'A'}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-200">{applicant.codename || applicant.name}</span>
                                            <Badge className="bg-indigo-950 border-indigo-800 text-indigo-300 text-[9px] px-1.5 py-0">
                                              Score: {applicant.score}/10
                                            </Badge>
                                          </div>
                                          <p className="text-[10px] text-slate-400">
                                            {applicant.sprintsCompleted} Sprint{applicant.sprintsCompleted !== 1 ? 's' : ''} Completed • {applicant.skills?.slice(0, 3).join(', ')}
                                          </p>
                                        </div>
                                      </div>

                                      <Button
                                        size="sm"
                                        className="h-7 text-[10px]"
                                        onClick={() => {
                                          handleSendInterview({
                                            codename: applicant.codename,
                                            role: job.title,
                                            skills: applicant.skills,
                                            sprintsCompleted: applicant.sprintsCompleted,
                                            matchScore: applicant.score * 10
                                          });
                                        }}
                                      >
                                        Send Request
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Squad Hiring Spotlight */}
                <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base text-white">Recommended Bonded Squad</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Pre-assembled teams that completed collaborative sprints with high synergy ratings
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('squads')} className="text-xs text-blue-400 hover:text-blue-300">
                      View All Squads
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{squadRecommendations[0].name}</h4>
                            <Badge className="bg-amber-950 border-amber-800 text-amber-300 text-[10px]">
                              {squadRecommendations[0].status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {squadRecommendations[0].members} Engineers • {squadRecommendations[0].completedSprints} Collaborative Sprints • {squadRecommendations[0].successRate}% Success Rate
                          </p>
                        </div>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs">
                          Initiate Squad Outreach
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {squadRecommendations[0].specialties.map((spec, i) => (
                          <span key={i} className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Top Candidate Matches */}
              <div className="space-y-6">
                <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white">Top Candidate Matches</CardTitle>
                      <Badge variant="outline" className="border-emerald-800 text-emerald-300 text-[10px]">
                        Verified Code
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-400">
                      Anonymous profiles ranked by rubric score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredTalent.slice(0, 3).map((dev) => (
                      <div key={dev.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold text-white">{dev.codename}</p>
                            <p className="text-[11px] text-slate-400">{dev.role}</p>
                          </div>
                          <Badge className="bg-emerald-950 border-emerald-800 text-emerald-300 text-[10px]">
                            {dev.matchScore}% Match
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {dev.skills?.map((s: string, idx: number) => (
                            <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                              {s}
                            </span>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-[11px] border-slate-700 hover:bg-slate-800 text-slate-200 mt-1">
                          View Verified Portfolio
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* TAB 2: TALENT RADAR */}
          <TabsContent value="talent" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Bias-Free Talent Radar</h3>
                <p className="text-xs text-slate-400">Search engineers purely by verified sprint deliverables, algorithmic accuracy, and code quality.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search skills, codename..."
                    value={talentQuery}
                    onChange={(e) => setTalentQuery(e.target.value)}
                    className="pl-8 bg-slate-900 border-slate-800 text-xs h-9 text-white"
                  />
                </div>
              </div>
            </div>

            {filteredTalent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTalent.map((dev) => (
                  <Card key={dev.id} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-[10px]">
                          {dev.sprintsCompleted} Sprints Passed
                        </Badge>
                        <span className="text-xs text-emerald-400 font-bold">
                          {dev.matchScore}% Match
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold text-white">{dev.codename}</CardTitle>
                      <CardDescription className="text-xs text-slate-400">{dev.role}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Code Quality Score</span>
                          <span className="font-bold text-emerald-400">{dev.score} / 10</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{dev.endorsement}</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {dev.skills?.map((skill: string, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="border-t border-slate-800/80 pt-3">
                      <Button 
                        onClick={() => handleSendInterview(dev)}
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Interview Request
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Candidates Found"
                description="No verified developers match your search query. Try broadening your skill requirements or search terms."
                actionLabel="Reset Search"
                onAction={() => setTalentQuery('')}
              />
            )}
          </TabsContent>

          {/* TAB 3: SQUAD HIRING */}
          <TabsContent value="squads" className="space-y-6">
            <div className="pb-2">
              <h3 className="text-lg font-semibold text-white">Pre-Assembled Engineering Squads</h3>
              <p className="text-xs text-slate-400">Hire complete, high-synergy teams who have already proven they can deliver production code together.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {squadRecommendations.map((squad) => (
                <Card key={squad.id} className="bg-slate-900/60 border-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-center mb-1">
                      <Badge className="bg-amber-950 border-amber-800 text-amber-300 text-[10px]">
                        {squad.members} Developers
                      </Badge>
                      <span className="text-xs text-emerald-400 font-bold">Synergy Score: {squad.teamScore} / 10</span>
                    </div>
                    <CardTitle className="text-base text-white">{squad.name}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Completed {squad.completedSprints} collaborative challenge sprints with a {squad.successRate}% rubric pass rate.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {squad.specialties.map((spec, i) => (
                        <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Deployment Readiness</span>
                        <span className="text-emerald-400 font-semibold">Immediate</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Target Tech Stack</span>
                        <span className="text-slate-200">Full-Stack Cloud Native</span>
                      </div>
                    </div>
                  </CardContent>

                   <CardFooter className="border-t border-slate-800/80 pt-3">
                    <Button 
                      onClick={() => handleHireSquad(squad.name)}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Hire Full Squad
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 4: SPONSORED SPRINTS */}
          <TabsContent value="sprints" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Your Sponsored Sprints</h3>
                <p className="text-xs text-slate-400">Custom simulation challenges to scout and filter top engineering candidates automatically.</p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
                onClick={() => setShowCreateChallengeModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Create Sponsored Challenge
              </Button>
            </div>

            {activeSprints && activeSprints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeSprints.map((sprint: any) => (
                  <Card key={sprint.id || sprint._id || sprint.title} className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                      <Badge className="bg-blue-950 border-blue-800 text-blue-300 text-[10px] w-fit mb-1">
                        Active Challenge
                      </Badge>
                      <CardTitle className="text-base text-white">{sprint.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-400">{sprint.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="border-t border-slate-800/80 pt-3 flex justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        {sprintSubmissionCounts[sprint.title] ?? 0} Submissions
                      </span>
                      <Button 
                        onClick={() => handleViewSubmissions(sprint.title)}
                        size="sm" 
                        variant="outline" 
                        className="border-slate-700 text-xs text-slate-200"
                      >
                        View Submissions
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Sponsored Sprints Yet"
                description="Sponsor a technical sprint challenge to benchmark hundreds of applicants on your exact stack."
                actionLabel="Create First Challenge"
              />
            )}
          </TabsContent>

        </Tabs>

      </div>

      {/* MODAL 1: POST ROLE */}
      <Dialog open={showPostRoleModal} onOpenChange={setShowPostRoleModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Post a New Job Opening</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Publish a new position to match against verified simulation candidates in real-time.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostRole} className="space-y-4 pt-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-slate-300 text-xs">Job Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g. Senior Backend Engineer" 
                value={newJobTitle} 
                onChange={(e) => setNewJobTitle(e.target.value)} 
                className="bg-slate-950 border-slate-800 text-white text-xs h-9" 
                required 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dept" className="text-slate-300 text-xs">Department *</Label>
              <Input 
                id="dept" 
                placeholder="e.g. Infrastructure, Core App" 
                value={newJobDept} 
                onChange={(e) => setNewJobDept(e.target.value)} 
                className="bg-slate-950 border-slate-800 text-white text-xs h-9" 
                required 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="skills" className="text-slate-300 text-xs">Required Skills (Comma separated) *</Label>
              <Input 
                id="skills" 
                placeholder="e.g. Python, Docker, FastAPI" 
                value={newJobSkills} 
                onChange={(e) => setNewJobSkills(e.target.value)} 
                className="bg-slate-950 border-slate-800 text-white text-xs h-9" 
                required 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc" className="text-slate-300 text-xs">Job Description</Label>
              <Textarea 
                id="desc" 
                placeholder="Outline core responsibilities and stack expectations..." 
                value={newJobDesc} 
                onChange={(e) => setNewJobDesc(e.target.value)} 
                className="bg-slate-950 border-slate-800 text-white text-xs" 
                rows={3} 
              />
            </div>
            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowPostRoleModal(false)}
                className="text-xs hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submittingJob}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submittingJob ? 'Publishing...' : 'Publish Position'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: VIEW SUBMISSIONS */}
      <Dialog open={showSubmissionsModal} onOpenChange={setShowSubmissionsModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Submissions: {selectedSprintTitle}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Inspect candidate code outputs and grading rubrics from live sprint evaluations.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 space-y-4">
            {loadingSubmissions ? (
              <div className="flex flex-col items-center py-10 justify-center space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading candidate submissions...</span>
              </div>
            ) : sprintSubmissions.length > 0 ? (
              <div className="space-y-3">
                 {sprintSubmissions.map((sub: any) => {
                    const subId = sub._id?.toString() || sub.id;
                    const isExpanded = expandedSubId === subId;
                    return (
                      <div key={subId} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white font-mono">{sub.anonymous_id || 'dev_anonymous'}</span>
                              <Badge className="bg-slate-800 border-slate-700 text-slate-300 text-[10px]">
                                {sub.priority}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] text-slate-400">Checkpoints</p>
                              <span className="text-[11px] text-slate-300 font-semibold">{sub.tests_passed}</span>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-[10px] text-slate-400">AI Score</p>
                              <span className="text-xs text-emerald-400 font-bold">{sub.ai_score}</span>
                            </div>
                            {sub.solution && (
                              <Button
                                onClick={() => setExpandedSubId(isExpanded ? null : subId)}
                                size="sm"
                                variant="ghost"
                                className="text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 h-7"
                              >
                                {isExpanded ? 'Hide Code' : 'View Code'}
                              </Button>
                            )}
                          </div>
                        </div>
                        {isExpanded && sub.solution && (
                          <div className="mt-1 p-2.5 bg-slate-900 rounded border border-slate-800">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">Submitted Solution Code:</p>
                            <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap p-2 bg-black/60 rounded max-h-60 border border-slate-800">
                              {sub.solution}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs">
                No submissions found for this challenge. Once candidates submit solutions, they will be listed here instantly.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* MODAL 3: CREATE SPONSORED CHALLENGE */}
      <Dialog open={showCreateChallengeModal} onOpenChange={setShowCreateChallengeModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Create Sponsored Challenge</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Define a real-world simulation sprint to automatically evaluate candidates at scale.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!challengeTitle.trim()) return;
              setSubmittingChallenge(true);
              try {
                const res = await fetch('/api/sprints/available', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: challengeTitle,
                    description: challengeDesc,
                    stack: challengeStack.split(',').map((s: string) => s.trim()).filter(Boolean),
                    duration_hours: parseInt(challengeDuration),
                    sponsored: true,
                  })
                });
                const newSprint = res.ok ? await res.json() : null;
                if (newSprint) {
                  setActiveSprints((prev) => [newSprint, ...prev]);
                }
                setShowCreateChallengeModal(false);
                setChallengeTitle('');
                setChallengeDesc('');
                setChallengeStack('');
                setChallengeDuration('2');
                toast({ title: 'Challenge Created', description: `"${challengeTitle}" is now live for candidates.` });
              } catch {
                toast({ title: 'Error', description: 'Failed to create challenge. Try again.' });
              } finally {
                setSubmittingChallenge(false);
              }
            }}
            className="space-y-4 pt-3"
          >
            <div className="space-y-1">
              <Label htmlFor="ch-title" className="text-slate-300 text-xs">Challenge Title *</Label>
              <Input
                id="ch-title"
                placeholder="e.g. Build a Rate-Limited REST API"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ch-desc" className="text-slate-300 text-xs">Description</Label>
              <Textarea
                id="ch-desc"
                placeholder="Describe the problem and expected deliverable..."
                value={challengeDesc}
                onChange={(e) => setChallengeDesc(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ch-stack" className="text-slate-300 text-xs">Tech Stack (comma separated)</Label>
              <Input
                id="ch-stack"
                placeholder="e.g. FastAPI, PostgreSQL, Redis"
                value={challengeStack}
                onChange={(e) => setChallengeStack(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ch-duration" className="text-slate-300 text-xs">Duration (hours)</Label>
              <Input
                id="ch-duration"
                type="number"
                min={1}
                max={72}
                value={challengeDuration}
                onChange={(e) => setChallengeDuration(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateChallengeModal(false)}
                className="text-xs hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingChallenge}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submittingChallenge ? 'Publishing...' : 'Launch Challenge'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
