"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CandidateSearch from './components/CandidateSearch'
import InterviewScheduler from './components/InterviewScheduler'
import JobRadar from '@/components/JobRadar'
import {
    Activity,
    BarChart3,
    Bell,
    Bot,
    Briefcase,
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    Filter,
    Globe,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Play,
    Plus,
    Radar,
    Search,
    Send,
    Settings,
    Star,
    Target,
    TrendingUp,
    Users,
    Zap
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/auth/RoleGuard"

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [radarActive, setRadarActive] = useState(true)
  const [agentStatus, setAgentStatus] = useState({
    jobRadar: "active",
    talentMatching: "active", 
    outreach: "idle"
  })

  // Mock data for AI agents and radar system
  const radarInsights = [
    {
      id: 1,
      type: "job_detected",
      company: "TechCorp",
      position: "Senior React Developer",
      source: "LinkedIn Jobs",
      matchedCandidates: 5,
      confidence: 0.92,
      timestamp: "2 hours ago",
      status: "new"
    },
    {
      id: 2,
      type: "outreach_sent",
      company: "StartupXYZ",
      position: "Full Stack Engineer",
      candidatesReached: 3,
      responseRate: 0.67,
      timestamp: "4 hours ago",
      status: "active"
    },
    {
      id: 3,
      type: "match_found",
      company: "DataSystems",
      position: "DevOps Engineer",
      matchScore: 0.89,
      candidateId: "dev_456",
      timestamp: "6 hours ago",
      status: "pending"
    }
  ]

  const candidatePipeline = [
    {
      id: "c1",
      name: "Alex Chen",
      codename: "ReactNinja_2024",
      position: "Senior Frontend Developer",
      stage: "initial_contact",
      matchScore: 0.94,
      skills: ["React", "TypeScript", "Next.js", "GraphQL"],
      experience: "5 years",
      location: "San Francisco, CA",
      availability: "Available",
      lastActivity: "Responded to outreach",
      timestamp: "2 hours ago",
      avatar: "/placeholder-user.jpg",
      source: "AI Radar"
    },
    {
      id: "c2", 
      name: "Sarah Johnson",
      codename: "FullStackPro",
      position: "Full Stack Developer",
      stage: "technical_review",
      matchScore: 0.87,
      skills: ["Python", "Django", "React", "PostgreSQL"],
      experience: "4 years",
      location: "Austin, TX",
      availability: "2 weeks notice",
      lastActivity: "Completed technical assessment",
      timestamp: "1 day ago",
      avatar: "/placeholder-user.jpg",
      source: "Direct Application"
    },
    {
      id: "c3",
      name: "Michael Rodriguez",
      codename: "CloudArchitect",
      position: "DevOps Engineer", 
      stage: "interview_scheduled",
      matchScore: 0.91,
      skills: ["AWS", "Kubernetes", "Terraform", "Python"],
      experience: "6 years",
      location: "Remote",
      availability: "Available",
      lastActivity: "Interview scheduled for tomorrow",
      timestamp: "3 hours ago",
      avatar: "/placeholder-user.jpg",
      source: "AI Radar"
    }
  ]

  const jobPostings = [
    {
      id: "j1",
      title: "Senior React Developer",
      status: "active",
      applications: 12,
      matches: 8,
      posted: "3 days ago",
      budget: "$120k - $150k",
      location: "San Francisco, CA"
    },
    {
      id: "j2", 
      title: "DevOps Engineer",
      status: "active",
      applications: 6,
      matches: 4,
      posted: "1 week ago",
      budget: "$130k - $160k",
      location: "Remote"
    },
    {
      id: "j3",
      title: "Full Stack Developer",
      status: "draft",
      applications: 0,
      matches: 0,
      posted: "Draft",
      budget: "$100k - $130k",
      location: "Austin, TX"
    }
  ]

  const dashboardMetrics = {
    activeJobs: 8,
    totalApplications: 156,
    candidatesInPipeline: 23,
    interviewsScheduled: 8,
    offersPending: 5,
    hiresThisMonth: 3,
    avgTimeToHire: 18.5,
    successRate: 0.94,
    radarDetections: 47,
    outreachResponseRate: 0.68
  }

  return (
    <RoleGuard allowedRoles={['employer', 'admin']}>
      <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900/95 to-blue-950/80">
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-black/70 border border-white/10 text-white focus:outline-none"
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Navigation */}
      <nav
        className={`fixed md:static top-0 left-0 h-full ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-black/60 border-r border-white/5 p-6 flex flex-col justify-between z-40 transition-all duration-300 md:flex`}
        style={{ minWidth: sidebarCollapsed ? '5rem' : '16rem' }}
        aria-label="Sidebar"
      >
        {/* Collapse/Expand button for desktop */}
        <div className="hidden md:flex justify-end mb-4">
          <button
            className="p-2 rounded bg-black/70 border border-white/10 text-white focus:outline-none"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-col space-y-2">
          <div className={`flex items-center mb-8 transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : ''}`}> 
            <Radar className="h-7 w-7 text-blue-400" />
            {!sidebarCollapsed && <span className="ml-2 text-xl font-bold text-white">BreakIn Radar</span>}
          </div>
          
          {[
            { label: 'Overview', value: 'overview', icon: <BarChart3 className="h-5 w-5" /> },
            { label: 'AI Radar', value: 'radar', icon: <Radar className="h-5 w-5" /> },
            { label: 'Candidate Search', value: 'search', icon: <Search className="h-5 w-5" /> },
            { label: 'Candidate Pipeline', value: 'pipeline', icon: <Users className="h-5 w-5" /> },
            { label: 'Interviews', value: 'interviews', icon: <Calendar className="h-5 w-5" /> },
            { label: 'Job Postings', value: 'jobs', icon: <Briefcase className="h-5 w-5" /> },
            { label: 'Contracts & Offers', value: 'contracts', icon: <CreditCard className="h-5 w-5" /> },
            { label: 'Reports & Analytics', value: 'reports', icon: <TrendingUp className="h-5 w-5" /> },
            { label: 'Settings', value: 'settings', icon: <Settings className="h-5 w-5" /> },
          ].map((item) => (
            <Button
              key={item.value}
              variant={activeTab === item.value ? 'secondary' : 'ghost'}
              className={`justify-start text-white hover:bg-white/5 w-full flex items-center ${activeTab === item.value ? 'bg-blue-600/20 border-l-4 border-blue-400' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              onClick={() => { setActiveTab(item.value); setSidebarOpen(false); }}
              style={{ minHeight: '2.5rem' }}
            >
              {item.icon}
              {!sidebarCollapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          ))}
        </div>

        <div className={`flex flex-col space-y-2 mt-8 ${sidebarCollapsed ? 'items-center' : ''}`}>
          <Button variant="ghost" className={`justify-start text-white hover:bg-white/5 w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
            <MessageSquare className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-2">Support</span>}
          </Button>
          <Button variant="ghost" className={`justify-start text-white hover:bg-white/5 w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>CO</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && <span className="ml-2">Profile</span>}
          </Button>
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Sidebar overlay"
        />
      )}

      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white">Employer Dashboard</h1>
                  <p className="text-gray-400">AI-powered talent acquisition and pipeline management</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${radarActive ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    <Radar className="h-3 w-3 mr-1" />
                    Radar {radarActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch 
                    checked={radarActive} 
                    onCheckedChange={setRadarActive}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Active Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{dashboardMetrics.activeJobs}</div>
                    <p className="text-xs text-green-400">+2 this week</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{dashboardMetrics.candidatesInPipeline}</div>
                    <p className="text-xs text-blue-400">Candidates active</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                      <Radar className="h-4 w-4 mr-2" />
                      Radar Detections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{dashboardMetrics.radarDetections}</div>
                    <p className="text-xs text-green-400">This month</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{Math.round(dashboardMetrics.successRate * 100)}%</div>
                    <p className="text-xs text-green-400">Above average</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Agent Status */}
              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-blue-400" />
                    AI Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-400/20 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Job Radar Agent</p>
                        <p className="text-gray-400 text-sm">Scanning job boards</p>
                      </div>
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-400/20 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Talent Matching</p>
                        <p className="text-gray-400 text-sm">Processing matches</p>
                      </div>
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-600/10 border border-yellow-400/20 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Outreach Agent</p>
                        <p className="text-gray-400 text-sm">Standby mode</p>
                      </div>
                      <Badge className="bg-yellow-600 text-white">Idle</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Radar Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {radarInsights.slice(0, 3).map((insight) => (
                        <div key={insight.id} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            insight.type === 'job_detected' ? 'bg-green-400' :
                            insight.type === 'outreach_sent' ? 'bg-blue-400' : 'bg-yellow-400'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-white text-sm">
                              {insight.type === 'job_detected' && `New job detected: ${insight.position} at ${insight.company}`}
                              {insight.type === 'outreach_sent' && `Outreach sent for ${insight.position} role`}
                              {insight.type === 'match_found' && `High match found for ${insight.position}`}
                            </p>
                            <p className="text-gray-400 text-xs">{insight.timestamp}</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job Posting
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent">
                      <Search className="h-4 w-4 mr-2" />
                      Search Candidates
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent">
                      <Radar className="h-4 w-4 mr-2" />
                      Configure Radar
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI Radar Tab */}
          <TabsContent value="radar" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Job Radar</h2>
                  <p className="text-gray-400">AI-powered job discovery from multiple platforms</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={`${radarActive ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    <Radar className="h-3 w-3 mr-1" />
                    Radar {radarActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch 
                    checked={radarActive} 
                    onCheckedChange={setRadarActive}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>

              <JobRadar />
            </div>
          </TabsContent>

          {/* Candidate Search Tab */}
          <TabsContent value="search" className="mt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Candidate Search</h2>
                <p className="text-gray-400">Search and discover top talent with AI-powered matching</p>
              </div>
              <CandidateSearch />
            </div>
          </TabsContent>

          {/* Interviews Tab */}
          <TabsContent value="interviews" className="mt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Interview Scheduler</h2>
                <p className="text-gray-400">Schedule and manage candidate interviews</p>
              </div>
              <InterviewScheduler />
            </div>
          </TabsContent>

          {/* Candidate Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Candidate Pipeline</h2>
                  <p className="text-gray-400">Manage your talent pipeline and track candidate progress</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Select>
                    <SelectTrigger className="bg-black/60 border-white/10 text-white w-48">
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="initial_contact">Initial Contact</SelectItem>
                      <SelectItem value="technical_review">Technical Review</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="offer_sent">Offer Sent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Candidate
                  </Button>
                </div>
              </div>

              {/* Pipeline Kanban */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['initial_contact', 'technical_review', 'interview_scheduled', 'offer_sent'].map((stage) => (
                  <Card key={stage} className="bg-black/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">
                        {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardTitle>
                      <Badge className="w-fit bg-gray-600 text-white">
                        {candidatePipeline.filter(c => c.stage === stage).length}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {candidatePipeline
                        .filter(candidate => candidate.stage === stage)
                        .map((candidate) => (
                          <div key={candidate.id} className="p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center space-x-3 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={candidate.avatar} />
                                <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">{candidate.name}</p>
                                <p className="text-gray-400 text-xs">{candidate.codename}</p>
                              </div>
                              <Badge className="bg-blue-600 text-white text-xs">
                                {Math.round(candidate.matchScore * 100)}%
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-xs mb-2">{candidate.position}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {candidate.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} className="bg-gray-700 text-gray-300 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">{candidate.source}</span>
                              <span className="text-gray-400">{candidate.timestamp}</span>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Job Postings Tab */}
          <TabsContent value="jobs" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Job Postings</h2>
                  <p className="text-gray-400">Manage your job postings and track applications</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job Posting
                </Button>
              </div>

              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Job Title</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Applications</TableHead>
                        <TableHead className="text-gray-300">AI Matches</TableHead>
                        <TableHead className="text-gray-300">Budget</TableHead>
                        <TableHead className="text-gray-300">Posted</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobPostings.map((job) => (
                        <TableRow key={job.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{job.title}</p>
                              <p className="text-gray-400 text-sm">{job.location}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${
                              job.status === 'active' ? 'bg-green-600' :
                              job.status === 'draft' ? 'bg-yellow-600' : 'bg-gray-600'
                            } text-white`}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{job.applications}</TableCell>
                          <TableCell className="text-blue-400">{job.matches}</TableCell>
                          <TableCell className="text-white">{job.budget}</TableCell>
                          <TableCell className="text-gray-400">{job.posted}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contracts & Offers Tab */}
          <TabsContent value="contracts" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Contracts & Offers</h2>
                  <p className="text-gray-400">Manage job offers and contract lifecycle</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </div>

              {/* Offer Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Pending Offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-600/10 border border-yellow-400/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">Alex Chen</p>
                            <p className="text-gray-400 text-sm">Senior Frontend Developer</p>
                          </div>
                          <Badge className="bg-yellow-600 text-white">Pending</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Salary</p>
                            <p className="text-white">$140,000</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Sent</p>
                            <p className="text-white">2 days ago</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            View Offer
                          </Button>
                          <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Contract Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Full-Time Developer</p>
                            <p className="text-gray-400 text-sm">Standard employment contract</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent">
                            Use Template
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Contract Developer</p>
                            <p className="text-gray-400 text-sm">Freelance/contract work</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Integration */}
              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
                    Payment & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-600/10 border border-green-400/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">Current Plan</p>
                        <Badge className="bg-green-600 text-white">Pro</Badge>
                      </div>
                      <p className="text-gray-400 text-sm">$299/month</p>
                      <p className="text-gray-400 text-sm">Next billing: Jan 15, 2024</p>
                    </div>
                    <div className="p-4 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">Usage This Month</p>
                      </div>
                      <p className="text-white text-lg">23/50</p>
                      <p className="text-gray-400 text-sm">Job postings used</p>
                    </div>
                    <div className="p-4 bg-purple-600/10 border border-purple-400/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">Total Spent</p>
                      </div>
                      <p className="text-white text-lg">$2,394</p>
                      <p className="text-gray-400 text-sm">This year</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
                  <p className="text-gray-400">Track hiring performance and generate insights</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Avg. Time to Hire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{dashboardMetrics.avgTimeToHire} days</div>
                    <p className="text-xs text-green-400">-2.3 days vs last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Outreach Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{Math.round(dashboardMetrics.outreachResponseRate * 100)}%</div>
                    <p className="text-xs text-green-400">+5% vs industry avg</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Cost per Hire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">$2,450</div>
                    <p className="text-xs text-red-400">+$200 vs last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">8.7/10</div>
                    <p className="text-xs text-green-400">Above benchmark</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Reports */}
              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Hiring Funnel Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { stage: 'Applications Received', count: 156, percentage: 100 },
                      { stage: 'Initial Screening', count: 89, percentage: 57 },
                      { stage: 'Technical Review', count: 45, percentage: 29 },
                      { stage: 'Interviews', count: 23, percentage: 15 },
                      { stage: 'Offers Sent', count: 8, percentage: 5 },
                      { stage: 'Hires', count: 3, percentage: 2 }
                    ].map((stage) => (
                      <div key={stage.stage} className="flex items-center space-x-4">
                        <div className="w-32 text-gray-300 text-sm">{stage.stage}</div>
                        <div className="flex-1">
                          <Progress value={stage.percentage} className="h-2" />
                        </div>
                        <div className="w-16 text-white text-sm text-right">{stage.count}</div>
                        <div className="w-12 text-gray-400 text-sm text-right">{stage.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-gray-400">Configure your employer dashboard and AI agents</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Company Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Company Name</Label>
                      <Input className="bg-black/60 border-white/10 text-white mt-1" defaultValue="TechCorp Inc." />
                    </div>
                    <div>
                      <Label className="text-gray-300">Industry</Label>
                      <Select>
                        <SelectTrigger className="bg-black/60 border-white/10 text-white">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Company Size</Label>
                      <Select>
                        <SelectTrigger className="bg-black/60 border-white/10 text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="startup">1-10 employees</SelectItem>
                          <SelectItem value="small">11-50 employees</SelectItem>
                          <SelectItem value="medium">51-200 employees</SelectItem>
                          <SelectItem value="large">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">AI Agent Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Auto-Outreach</p>
                        <p className="text-gray-400 text-sm">Automatically reach out to matched candidates</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Smart Notifications</p>
                        <p className="text-gray-400 text-sm">Get notified about high-quality matches</p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Weekly Reports</p>
                        <p className="text-gray-400 text-sm">Receive weekly hiring analytics</p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </RoleGuard>
  )
}