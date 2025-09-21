"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Target,
  Mail,
  Phone,
  MapPin,
  Star,
  MoreHorizontal
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { KanbanBoard, Candidate, KanbanColumn } from '@/components/ui/kanban-board'
import { cn } from '@/lib/utils'

// Mock data for candidates
const mockCandidates: Candidate[] = [
  {
    id: "candidate_1",
    name: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "+1-555-0123",
    codename: "ReactNinja_2024",
    position_applied: "Senior Frontend Developer",
    job_id: "job_1",
    current_stage: "initial_contact",
    source: "ai_radar",
    match_score: 0.94,
    skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    experience_years: 5,
    location: "San Francisco, CA",
    availability: "available",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-17T14:30:00Z",
    last_activity: "2024-01-17T14:30:00Z",
    next_follow_up: "2024-01-18T10:00:00Z"
  },
  {
    id: "candidate_2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1-555-0124",
    codename: "FullStackPro",
    position_applied: "Full Stack Developer",
    job_id: "job_2",
    current_stage: "technical_review",
    source: "direct_application",
    match_score: 0.87,
    skills: ["Python", "Django", "React", "PostgreSQL"],
    experience_years: 4,
    location: "Austin, TX",
    availability: "2_weeks_notice",
    created_at: "2024-01-12T09:00:00Z",
    updated_at: "2024-01-16T16:45:00Z",
    last_activity: "2024-01-16T16:45:00Z",
    next_follow_up: "2024-01-19T11:00:00Z"
  },
  {
    id: "candidate_3",
    name: "Michael Rodriguez",
    email: "m.rodriguez@email.com",
    codename: "BackendGuru",
    position_applied: "Backend Engineer",
    job_id: "job_3",
    current_stage: "interview_scheduled",
    source: "referral",
    match_score: 0.91,
    skills: ["Node.js", "Express", "MongoDB", "AWS"],
    experience_years: 6,
    location: "New York, NY",
    availability: "available",
    created_at: "2024-01-10T11:00:00Z",
    updated_at: "2024-01-17T09:15:00Z",
    last_activity: "2024-01-17T09:15:00Z"
  },
  {
    id: "candidate_4",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    codename: "UIUXMaster",
    position_applied: "Frontend Developer",
    job_id: "job_1",
    current_stage: "offer_sent",
    source: "linkedin",
    match_score: 0.89,
    skills: ["React", "Vue.js", "Figma", "CSS"],
    experience_years: 3,
    location: "Seattle, WA",
    availability: "1_month_notice",
    created_at: "2024-01-08T14:00:00Z",
    updated_at: "2024-01-17T13:20:00Z",
    last_activity: "2024-01-17T13:20:00Z"
  },
  {
    id: "candidate_5",
    name: "David Kim",
    email: "david.kim@email.com",
    codename: "DevOpsExpert",
    position_applied: "DevOps Engineer",
    job_id: "job_4",
    current_stage: "screening",
    source: "ai_radar",
    match_score: 0.85,
    skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
    experience_years: 7,
    location: "Los Angeles, CA",
    availability: "available",
    created_at: "2024-01-14T08:30:00Z",
    updated_at: "2024-01-16T10:45:00Z",
    last_activity: "2024-01-16T10:45:00Z"
  }
]

const pipelineStages = [
  { id: 'sourced', title: 'Sourced', color: 'bg-gray-100' },
  { id: 'initial_contact', title: 'Initial Contact', color: 'bg-blue-100' },
  { id: 'screening', title: 'Screening', color: 'bg-yellow-100' },
  { id: 'technical_review', title: 'Technical Review', color: 'bg-orange-100' },
  { id: 'interview_scheduled', title: 'Interview Scheduled', color: 'bg-purple-100' },
  { id: 'interview_completed', title: 'Interview Completed', color: 'bg-indigo-100' },
  { id: 'offer_sent', title: 'Offer Sent', color: 'bg-green-100' },
  { id: 'hired', title: 'Hired', color: 'bg-green-200' }
]

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Filter candidates based on search and filters
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.codename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesJob = selectedJob === 'all' || candidate.job_id === selectedJob
    const matchesSource = selectedSource === 'all' || candidate.source === selectedSource
    
    return matchesSearch && matchesJob && matchesSource
  })

  // Group candidates by stage for Kanban board
  const kanbanColumns: KanbanColumn[] = pipelineStages.map(stage => ({
    id: stage.id,
    title: stage.title,
    color: stage.color,
    candidates: filteredCandidates.filter(candidate => candidate.current_stage === stage.id)
  }))

  const handleCandidateMove = async (candidateId: string, fromStage: string, toStage: string) => {
    try {
      // Update local state immediately for better UX
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, current_stage: toStage, updated_at: new Date().toISOString() }
          : candidate
      ))

      // Here you would make an API call to update the candidate stage
      // await updateCandidateStage(candidateId, toStage)
      
      console.log(`Moving candidate ${candidateId} from ${fromStage} to ${toStage}`)
    } catch (error) {
      console.error('Failed to update candidate stage:', error)
      // Revert the change if API call fails
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, current_stage: fromStage }
          : candidate
      ))
    }
  }

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsProfileOpen(true)
  }

  const handleScheduleInterview = (candidateId: string) => {
    console.log('Schedule interview for candidate:', candidateId)
    // Implement interview scheduling logic
  }

  const handleSendEmail = (candidateId: string) => {
    console.log('Send email to candidate:', candidateId)
    // Implement email sending logic
  }

  // Pipeline statistics
  const pipelineStats = {
    totalCandidates: filteredCandidates.length,
    activeInterviews: filteredCandidates.filter(c => c.current_stage === 'interview_scheduled').length,
    pendingOffers: filteredCandidates.filter(c => c.current_stage === 'offer_sent').length,
    recentHires: filteredCandidates.filter(c => c.current_stage === 'hired').length,
    averageMatchScore: filteredCandidates.reduce((sum, c) => sum + (c.match_score || 0), 0) / filteredCandidates.length
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidate Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your hiring pipeline and track candidate progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.activeInterviews}</div>
            <p className="text-xs text-muted-foreground">
              3 scheduled this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.pendingOffers}</div>
            <p className="text-xs text-muted-foreground">
              2 expiring soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Hires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.recentHires}</div>
            <p className="text-xs text-muted-foreground">
              +2 this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(pipelineStats.averageMatchScore * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="job_1">Frontend Developer</SelectItem>
                <SelectItem value="job_2">Full Stack Developer</SelectItem>
                <SelectItem value="job_3">Backend Engineer</SelectItem>
                <SelectItem value="job_4">DevOps Engineer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ai_radar">AI Radar</SelectItem>
                <SelectItem value="direct_application">Direct Application</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Board</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] p-6">
            <KanbanBoard
              columns={kanbanColumns}
              onCandidateMove={handleCandidateMove}
              onCandidateClick={handleCandidateClick}
              onScheduleInterview={handleScheduleInterview}
              onSendEmail={handleSendEmail}
            />
          </div>
        </CardContent>
      </Card>

      {/* Candidate Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the candidate
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCandidate.name}</h3>
                  <p className="text-muted-foreground">{selectedCandidate.codename}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Applied for {selectedCandidate.position_applied}
                  </p>
                </div>
                <div className="text-right">
                  {selectedCandidate.match_score && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {Math.round(selectedCandidate.match_score * 100)}% match
                      </span>
                    </div>
                  )}
                  <Badge className="mt-1">
                    {selectedCandidate.current_stage.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCandidate.email}</span>
                  </div>
                  {selectedCandidate.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCandidate.phone}</span>
                    </div>
                  )}
                  {selectedCandidate.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCandidate.location}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Experience:</span> {selectedCandidate.experience_years} years
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Availability:</span> {selectedCandidate.availability.replace('_', ' ')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Source:</span> {selectedCandidate.source.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleSendEmail(selectedCandidate.id)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button onClick={() => handleScheduleInterview(selectedCandidate.id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}