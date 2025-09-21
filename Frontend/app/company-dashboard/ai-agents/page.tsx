"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Radar, 
  Users, 
  Mail, 
  Play, 
  Pause, 
  Settings,
  TrendingUp,
  Target,
  Zap,
  Brain,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Globe,
  Star,
  Send,
  Eye,
  Filter,
  Download,
  RefreshCw
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
import { Progress } from '@/components/ui/progress'
import { useAgents, JobRadarResult, TalentMatchResult, OutreachCampaign, WorkflowExecution } from '@/hooks/useAgents'
import { cn } from '@/lib/utils'

export default function AIAgentsPage() {
  const {
    loading,
    error,
    runJobRadar,
    findTalentMatches,
    createOutreachCampaign,
    runReverseTalentRadar,
    getAgentInsights,
    createWorkflow,
    executeWorkflow,
    getWorkflowStatus,
    clearError
  } = useAgents()

  // State for different agent operations
  const [activeTab, setActiveTab] = useState('overview')
  const [jobRadarResults, setJobRadarResults] = useState<JobRadarResult[]>([])
  const [talentMatches, setTalentMatches] = useState<TalentMatchResult[]>([])
  const [outreachCampaigns, setOutreachCampaigns] = useState<OutreachCampaign[]>([])
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowExecution[]>([])
  const [insights, setInsights] = useState<any>(null)

  // Form states
  const [radarParams, setRadarParams] = useState({
    keywords: '',
    locations: '',
    salary_min: '',
    salary_max: '',
    experience_level: 'all',
    remote_ok: true
  })

  const [matchingParams, setMatchingParams] = useState({
    job_id: '',
    required_skills: '',
    experience_min: '',
    experience_max: '',
    location: '',
    remote_ok: true
  })

  const [outreachParams, setOutreachParams] = useState({
    campaign_name: '',
    target_companies: '',
    message_template: `Hi {{company_name}},

I noticed you recently posted a {{job_title}} position. We have several talented developers in our BreakIn community who might be a perfect fit.

Our developers have completed real-world projects and received mentor endorsements. Would you like to see their profiles?

Best regards,
BreakIn Team`,
    auto_send: false
  })

  const [reverseTalentParams, setReverseTalentParams] = useState({
    target_skills: 'React, TypeScript, Node.js',
    experience_levels: 'mid,senior',
    locations: '',
    auto_outreach: false
  })

  // Load initial data
  useEffect(() => {
    loadInsights()
    loadActiveWorkflows()
  }, [])

  const loadInsights = async () => {
    try {
      const data = await getAgentInsights()
      setInsights(data)
    } catch (err) {
      console.error('Failed to load insights:', err)
    }
  }

  const loadActiveWorkflows = async () => {
    // Mock active workflows - in real app, fetch from API
    setActiveWorkflows([
      {
        id: 'workflow_1',
        workflow_type: 'reverse_talent_radar',
        status: 'running',
        progress: 65,
        created_at: new Date().toISOString()
      },
      {
        id: 'workflow_2',
        workflow_type: 'daily_monitoring',
        status: 'completed',
        progress: 100,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString()
      }
    ])
  }

  // Handler functions
  const handleRunJobRadar = async () => {
    try {
      const keywords = radarParams.keywords.split(',').map(k => k.trim()).filter(Boolean)
      const locations = radarParams.locations.split(',').map(l => l.trim()).filter(Boolean)
      
      const results = await runJobRadar({
        keywords: keywords.length > 0 ? keywords : undefined,
        locations: locations.length > 0 ? locations : undefined,
        salary_min: radarParams.salary_min ? parseInt(radarParams.salary_min) : undefined,
        salary_max: radarParams.salary_max ? parseInt(radarParams.salary_max) : undefined,
        experience_level: radarParams.experience_level !== 'all' ? radarParams.experience_level : undefined,
        remote_ok: radarParams.remote_ok
      })
      
      setJobRadarResults(results)
    } catch (err) {
      console.error('Job radar failed:', err)
    }
  }

  const handleFindMatches = async () => {
    try {
      const required_skills = matchingParams.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      
      const results = await findTalentMatches({
        job_id: matchingParams.job_id || 'default_job',
        job_requirements: required_skills,
        required_skills,
        experience_min: matchingParams.experience_min ? parseInt(matchingParams.experience_min) : undefined,
        experience_max: matchingParams.experience_max ? parseInt(matchingParams.experience_max) : undefined,
        location: matchingParams.location || undefined,
        remote_ok: matchingParams.remote_ok,
        limit: 10
      })
      
      setTalentMatches(results)
    } catch (err) {
      console.error('Talent matching failed:', err)
    }
  }

  const handleCreateOutreach = async () => {
    try {
      const companies = outreachParams.target_companies.split('\n').map(line => {
        const [company_name, contact_email] = line.split(',').map(s => s.trim())
        return { company_name, contact_email }
      }).filter(c => c.company_name)

      const campaign = await createOutreachCampaign({
        campaign_name: outreachParams.campaign_name,
        target_companies: companies,
        message_template: outreachParams.message_template,
        personalization_fields: ['company_name', 'job_title'],
        follow_up_sequence: true
      })
      
      setOutreachCampaigns(prev => [...prev, campaign])
    } catch (err) {
      console.error('Outreach campaign creation failed:', err)
    }
  }

  const handleRunReverseTalentRadar = async () => {
    try {
      const target_skills = reverseTalentParams.target_skills.split(',').map(s => s.trim()).filter(Boolean)
      const experience_levels = reverseTalentParams.experience_levels.split(',').map(s => s.trim()).filter(Boolean)
      const locations = reverseTalentParams.locations ? reverseTalentParams.locations.split(',').map(s => s.trim()).filter(Boolean) : undefined

      const results = await runReverseTalentRadar({
        target_skills,
        experience_levels,
        locations,
        auto_outreach: reverseTalentParams.auto_outreach
      })
      
      setJobRadarResults(results.jobs_found)
      setTalentMatches(results.potential_matches)
      if (results.outreach_campaigns) {
        setOutreachCampaigns(prev => [...prev, ...results.outreach_campaigns])
      }
    } catch (err) {
      console.error('Reverse talent radar failed:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your intelligent hiring automation and talent discovery
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadInsights}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRunReverseTalentRadar} disabled={loading}>
            <Zap className="mr-2 h-4 w-4" />
            Run Reverse Radar
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Radar</CardTitle>
            <Radar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobRadarResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Jobs discovered today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Matches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{talentMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Candidates matched
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outreachCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              Active campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Match accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows */}
      {activeWorkflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeWorkflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <p className="font-medium">{workflow.workflow_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(workflow.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {workflow.progress}%
                      </span>
                    </div>
                    <Progress value={workflow.progress} className="h-2" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="job-radar">Job Radar</TabsTrigger>
          <TabsTrigger value="talent-matching">Talent Matching</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="reverse-radar">Reverse Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Discoveries</CardTitle>
              </CardHeader>
              <CardContent>
                {jobRadarResults.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{job.job_title}</p>
                      <p className="text-sm text-muted-foreground">{job.company_name}</p>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(job.match_score * 100)}% match
                    </Badge>
                  </div>
                ))}
                {jobRadarResults.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No jobs discovered yet. Run the job radar to find opportunities.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Talent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {talentMatches.slice(0, 5).map((match) => (
                  <div key={match.candidate_id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{match.candidate_name}</p>
                      <p className="text-sm text-muted-foreground">{match.codename}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {Math.round(match.match_score * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
                {talentMatches.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No matches found yet. Run talent matching to find candidates.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job-radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Radar Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scan external job boards for hiring opportunities
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Keywords (comma-separated)</label>
                  <Input
                    placeholder="React, TypeScript, Frontend"
                    value={radarParams.keywords}
                    onChange={(e) => setRadarParams(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Locations (comma-separated)</label>
                  <Input
                    placeholder="San Francisco, New York, Remote"
                    value={radarParams.locations}
                    onChange={(e) => setRadarParams(prev => ({ ...prev, locations: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Salary</label>
                  <Input
                    type="number"
                    placeholder="80000"
                    value={radarParams.salary_min}
                    onChange={(e) => setRadarParams(prev => ({ ...prev, salary_min: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Salary</label>
                  <Input
                    type="number"
                    placeholder="150000"
                    value={radarParams.salary_max}
                    onChange={(e) => setRadarParams(prev => ({ ...prev, salary_max: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Select value={radarParams.experience_level} onValueChange={(value) => setRadarParams(prev => ({ ...prev, experience_level: value }))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleRunJobRadar} disabled={loading}>
                  <Radar className="mr-2 h-4 w-4" />
                  {loading ? 'Scanning...' : 'Run Job Radar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {jobRadarResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Discovered Jobs ({jobRadarResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobRadarResults.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{job.job_title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company_name}</p>
                          <p className="text-sm text-muted-foreground">{job.location}</p>
                          {job.salary_range && (
                            <p className="text-sm font-medium text-green-600">{job.salary_range}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {Math.round(job.match_score * 100)}% match
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.potential_candidates} candidates
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.requirements.slice(0, 5).map((req) => (
                          <Badge key={req} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View Job
                        </Button>
                        <Button size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Find Matches
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="talent-matching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Talent Matching Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Find the best candidates for your job requirements
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Job ID</label>
                  <Input
                    placeholder="job_123"
                    value={matchingParams.job_id}
                    onChange={(e) => setMatchingParams(prev => ({ ...prev, job_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Required Skills</label>
                  <Input
                    placeholder="React, TypeScript, Node.js"
                    value={matchingParams.required_skills}
                    onChange={(e) => setMatchingParams(prev => ({ ...prev, required_skills: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Experience (years)</label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={matchingParams.experience_min}
                    onChange={(e) => setMatchingParams(prev => ({ ...prev, experience_min: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Experience (years)</label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={matchingParams.experience_max}
                    onChange={(e) => setMatchingParams(prev => ({ ...prev, experience_max: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Location (optional)"
                  value={matchingParams.location}
                  onChange={(e) => setMatchingParams(prev => ({ ...prev, location: e.target.value }))}
                  className="max-w-xs"
                />
                <Button onClick={handleFindMatches} disabled={loading}>
                  <Brain className="mr-2 h-4 w-4" />
                  {loading ? 'Matching...' : 'Find Matches'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {talentMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Talent Matches ({talentMatches.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {talentMatches.map((match) => (
                    <div key={match.candidate_id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{match.candidate_name}</h3>
                          <p className="text-sm text-muted-foreground">{match.codename}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.skill_matches.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">
                              {Math.round(match.match_score * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cultural fit: {Math.round(match.cultural_fit_score * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                        <Button size="sm">
                          <Mail className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach Campaign</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create personalized outreach campaigns to companies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  placeholder="Q1 Frontend Outreach"
                  value={outreachParams.campaign_name}
                  onChange={(e) => setOutreachParams(prev => ({ ...prev, campaign_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Companies (one per line: Company Name, email@domain.com)</label>
                <Textarea
                  placeholder="TechCorp Inc, hr@techcorp.com&#10;StartupXYZ, jobs@startupxyz.com"
                  value={outreachParams.target_companies}
                  onChange={(e) => setOutreachParams(prev => ({ ...prev, target_companies: e.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message Template</label>
                <Textarea
                  value={outreachParams.message_template}
                  onChange={(e) => setOutreachParams(prev => ({ ...prev, message_template: e.target.value }))}
                  rows={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Use {{company_name}} and {{job_title}} for personalization
                </div>
                <Button onClick={handleCreateOutreach} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {outreachCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns ({outreachCampaigns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outreachCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {campaign.target_companies.length} companies targeted
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {campaign.response_count}/{campaign.sent_count} responses
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button size="sm">
                            <Play className="mr-2 h-4 w-4" />
                            Launch
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reverse-radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reverse Talent Radar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Proactively discover hiring opportunities and match them with your talent pool
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Target Skills</label>
                  <Input
                    placeholder="React, TypeScript, Node.js"
                    value={reverseTalentParams.target_skills}
                    onChange={(e) => setReverseTalentParams(prev => ({ ...prev, target_skills: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Experience Levels</label>
                  <Input
                    placeholder="mid,senior"
                    value={reverseTalentParams.experience_levels}
                    onChange={(e) => setReverseTalentParams(prev => ({ ...prev, experience_levels: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Locations (optional)</label>
                  <Input
                    placeholder="San Francisco, New York"
                    value={reverseTalentParams.locations}
                    onChange={(e) => setReverseTalentParams(prev => ({ ...prev, locations: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-outreach"
                    checked={reverseTalentParams.auto_outreach}
                    onChange={(e) => setReverseTalentParams(prev => ({ ...prev, auto_outreach: e.target.checked }))}
                  />
                  <label htmlFor="auto-outreach" className="text-sm font-medium">
                    Auto-create outreach campaigns
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  This will scan job boards, find matches, and optionally create outreach campaigns
                </div>
                <Button onClick={handleRunReverseTalentRadar} disabled={loading} size="lg">
                  <Zap className="mr-2 h-4 w-4" />
                  {loading ? 'Running Radar...' : 'Run Reverse Radar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jobs Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{jobRadarResults.length}</div>
                <p className="text-sm text-muted-foreground">
                  Matching opportunities discovered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Talent Matched</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{talentMatches.length}</div>
                <p className="text-sm text-muted-foreground">
                  Candidates ready to be introduced
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outreach Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{outreachCampaigns.length}</div>
                <p className="text-sm text-muted-foreground">
                  Campaigns ready to launch
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}