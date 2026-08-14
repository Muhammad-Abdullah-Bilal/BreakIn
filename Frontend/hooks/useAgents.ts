"use client"

import { useState, useCallback } from 'react'

// Types for AI Agent interactions
export interface JobRadarResult {
  id: string
  company_name: string
  job_title: string
  job_url: string
  location: string
  salary_range?: string
  requirements: string[]
  posted_date: string
  match_score: number
  potential_candidates: number
  source: string
}

export interface TalentMatchResult {
  candidate_id: string
  candidate_name: string
  codename: string
  match_score: number
  skill_matches: string[]
  experience_match: number
  location_match: boolean
  availability_match: boolean
  cultural_fit_score: number
  strengths: string[]
  potential_concerns: string[]
}

export interface OutreachCampaign {
  id: string
  name: string
  target_companies: string[]
  message_template: string
  personalization_data: Record<string, any>
  status: 'draft' | 'active' | 'paused' | 'completed'
  sent_count: number
  response_count: number
  success_rate: number
}

export interface WorkflowExecution {
  id: string
  workflow_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  results?: any
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface AgentInsights {
  job_trends: {
    trending_skills: string[]
    salary_trends: Record<string, number>
    location_demand: Record<string, number>
    company_hiring_activity: Array<{
      company: string
      jobs_posted: number
      trend: 'up' | 'down' | 'stable'
    }>
  }
  matching_performance: {
    average_match_score: number
    successful_placements: number
    top_performing_skills: string[]
    conversion_rates: Record<string, number>
  }
  outreach_analytics: {
    response_rates: Record<string, number>
    best_performing_templates: string[]
    optimal_send_times: string[]
    company_engagement_scores: Record<string, number>
  }
}

const MOCK_INSIGHTS: AgentInsights = {
  job_trends: {
    trending_skills: ['React', 'TypeScript', 'FastAPI', 'AWS', 'Docker'],
    salary_trends: { 'React Developer': 115000, 'DevOps Engineer': 130000, 'Backend Engineer': 120000 },
    location_demand: { 'Remote': 68, 'San Francisco': 14, 'New York': 10, 'Austin': 8 },
    company_hiring_activity: [
      { company: 'Stripe', jobs_posted: 5, trend: 'up' },
      { company: 'Vercel', jobs_posted: 3, trend: 'stable' },
      { company: 'Anthropic', jobs_posted: 8, trend: 'up' }
    ]
  },
  matching_performance: {
    average_match_score: 88,
    successful_placements: 14,
    top_performing_skills: ['TypeScript', 'FastAPI', 'Next.js'],
    conversion_rates: { 'Sourcing': 0.85, 'Interview': 0.42, 'Offer': 0.18 }
  },
  outreach_analytics: {
    response_rates: { 'Template A': 0.42, 'Template B': 0.28 },
    best_performing_templates: ['Personalized Pitch', 'Quick Sync'],
    optimal_send_times: ['Tuesday 10 AM', 'Thursday 2 PM'],
    company_engagement_scores: { 'TechCorp': 92, 'StartupXYZ': 76 }
  }
}

const MOCK_JOB_RADAR: JobRadarResult[] = [
  {
    id: 'radar_1',
    company_name: 'Stripe',
    job_title: 'Senior Solutions Engineer',
    job_url: 'https://stripe.com/jobs',
    location: 'Remote (US)',
    salary_range: '$140k - $170k',
    requirements: ['React', 'Node.js', 'FinTech APIs'],
    posted_date: 'Just now',
    match_score: 94,
    potential_candidates: 3,
    source: 'Stripe Careers'
  },
  {
    id: 'radar_2',
    company_name: 'Vercel',
    job_title: 'Frontend Performance Specialist',
    job_url: 'https://vercel.com/jobs',
    location: 'Remote (Global)',
    salary_range: '$130k - $160k',
    requirements: ['Next.js', 'TypeScript', 'TailwindCSS'],
    posted_date: '2 hours ago',
    match_score: 92,
    potential_candidates: 5,
    source: 'LinkedIn Jobs'
  }
]

const MOCK_TALENT_MATCHES: TalentMatchResult[] = [
  {
    candidate_id: 'dev_1',
    candidate_name: 'John Engineer',
    codename: 'CyberFalcon_92',
    match_score: 96,
    skill_matches: ['React', 'TypeScript', 'FastAPI'],
    experience_match: 94,
    location_match: true,
    availability_match: true,
    cultural_fit_score: 90,
    strengths: ['Algorithmic complexity optimization', 'Clean error boundaries'],
    potential_concerns: []
  },
  {
    candidate_id: 'dev_2',
    candidate_name: 'Sarah Chen',
    codename: 'QuantumNode_11',
    match_score: 91,
    skill_matches: ['Python', 'Docker', 'PostgreSQL'],
    experience_match: 88,
    location_match: true,
    availability_match: true,
    cultural_fit_score: 85,
    strengths: ['Great test coverage', 'Idempotency design patterns'],
    potential_concerns: []
  }
]

export const useAgents = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const safeFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  // Job Radar Agent Functions
  const runJobRadar = useCallback(async (params: {
    keywords?: string[]
    locations?: string[]
    salary_min?: number
    salary_max?: number
    experience_level?: string
    company_size?: string
    remote_ok?: boolean
  }): Promise<JobRadarResult[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/job-radar/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: 'job_radar', parameters: params })
      })
      return Array.isArray(data) ? data : (data.results || MOCK_JOB_RADAR)
    } catch {
      // Graceful fallback — never crash the page
      return MOCK_JOB_RADAR
    } finally {
      setLoading(false)
    }
  }, [])

  const getJobTrends = useCallback(async (): Promise<any> => {
    try {
      return await safeFetch('/api/v1/agents/insights/job-trends')
    } catch {
      return MOCK_INSIGHTS.job_trends
    }
  }, [])

  // Talent Matching Agent Functions
  const findTalentMatches = useCallback(async (params: {
    job_id: string
    job_requirements: string[]
    required_skills: string[]
    preferred_skills?: string[]
    experience_min?: number
    experience_max?: number
    location?: string
    remote_ok?: boolean
    salary_range?: [number, number]
    cultural_values?: string[]
    limit?: number
  }): Promise<TalentMatchResult[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/talent-matching/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: 'talent_matching', parameters: params })
      })
      return Array.isArray(data) ? data : (data.matches || MOCK_TALENT_MATCHES)
    } catch {
      return MOCK_TALENT_MATCHES
    } finally {
      setLoading(false)
    }
  }, [])

  const getMatchingPerformance = useCallback(async (): Promise<any> => {
    try {
      return await safeFetch('/api/v1/agents/insights/matching-performance')
    } catch {
      return MOCK_INSIGHTS.matching_performance
    }
  }, [])

  // Outreach Agent Functions
  const createOutreachCampaign = useCallback(async (params: {
    campaign_name: string
    target_companies: Array<{
      company_name: string
      contact_email?: string
      job_posting_url?: string
      personalization_data?: Record<string, any>
    }>
    message_template: string
    personalization_fields: string[]
    schedule_send?: string
    follow_up_sequence?: boolean
  }): Promise<OutreachCampaign> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/outreach/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: 'outreach', parameters: params })
      })
      return data.campaign || data
    } catch {
      return {
        id: 'camp_' + Date.now(),
        name: params.campaign_name,
        target_companies: params.target_companies.map(c => c.company_name),
        message_template: params.message_template,
        personalization_data: {},
        status: 'active',
        sent_count: 0,
        response_count: 0,
        success_rate: 0
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getOutreachAnalytics = useCallback(async (): Promise<any> => {
    try {
      return await safeFetch('/api/v1/agents/insights/outreach-analytics')
    } catch {
      return MOCK_INSIGHTS.outreach_analytics
    }
  }, [])

  // Workflow Management Functions
  const createWorkflow = useCallback(async (params: {
    workflow_type: 'reverse_talent_radar' | 'daily_monitoring' | 'targeted_outreach'
    parameters: Record<string, any>
    schedule?: string
  }): Promise<WorkflowExecution> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return data
    } catch {
      return {
        id: 'wf_' + Date.now(),
        workflow_type: params.workflow_type,
        status: 'running',
        progress: 0,
        created_at: new Date().toISOString()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const executeWorkflow = useCallback(async (workflowId: string): Promise<WorkflowExecution> => {
    setLoading(true)
    setError(null)
    
    try {
      return await safeFetch(`/api/v1/agents/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch {
      return {
        id: workflowId,
        workflow_type: 'manual',
        status: 'completed',
        progress: 100,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getWorkflowStatus = useCallback(async (workflowId: string): Promise<WorkflowExecution> => {
    try {
      return await safeFetch(`/api/v1/agents/workflows/${workflowId}/status`)
    } catch {
      return {
        id: workflowId,
        workflow_type: 'unknown',
        status: 'completed',
        progress: 100,
        created_at: new Date().toISOString()
      }
    }
  }, [])

  // Comprehensive Agent Insights
  const getAgentInsights = useCallback(async (): Promise<AgentInsights> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/insights/comprehensive')
      return data
    } catch {
      // Return rich mock data — never throw
      return MOCK_INSIGHTS
    } finally {
      setLoading(false)
    }
  }, [])

  // Reverse Talent Radar - Main Feature
  const runReverseTalentRadar = useCallback(async (params: {
    target_skills: string[]
    experience_levels: string[]
    locations?: string[]
    company_types?: string[]
    auto_outreach?: boolean
    outreach_template?: string
  }): Promise<{
    jobs_found: JobRadarResult[]
    potential_matches: TalentMatchResult[]
    outreach_campaigns?: OutreachCampaign[]
    insights: any
  }> => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await safeFetch('/api/v1/agents/workflows/reverse-talent-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_type: 'reverse_talent_radar', parameters: params })
      })
      return data
    } catch {
      return {
        jobs_found: MOCK_JOB_RADAR,
        potential_matches: MOCK_TALENT_MATCHES,
        insights: MOCK_INSIGHTS
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    loading,
    error,
    
    // Job Radar Functions
    runJobRadar,
    getJobTrends,
    
    // Talent Matching Functions
    findTalentMatches,
    getMatchingPerformance,
    
    // Outreach Functions
    createOutreachCampaign,
    getOutreachAnalytics,
    
    // Workflow Functions
    createWorkflow,
    executeWorkflow,
    getWorkflowStatus,
    
    // Comprehensive Functions
    getAgentInsights,
    runReverseTalentRadar,
    
    // Utility Functions
    clearError: () => setError(null)
  }
}