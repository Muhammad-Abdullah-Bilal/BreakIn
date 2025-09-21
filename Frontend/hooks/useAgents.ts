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

export const useAgents = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const response = await fetch('/api/v1/agents/job-radar/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'job_radar',
          parameters: params
        })
      })

      if (!response.ok) {
        throw new Error(`Job radar failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Job radar execution failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getJobTrends = useCallback(async (): Promise<any> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/agents/insights/job-trends')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job trends: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job trends'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/v1/agents/talent-matching/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'talent_matching',
          parameters: params
        })
      })

      if (!response.ok) {
        throw new Error(`Talent matching failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.matches || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Talent matching execution failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getMatchingPerformance = useCallback(async (): Promise<any> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/agents/insights/matching-performance')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch matching performance: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch matching performance'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/v1/agents/outreach/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'outreach',
          parameters: params
        })
      })

      if (!response.ok) {
        throw new Error(`Outreach campaign creation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.campaign
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Outreach campaign creation failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getOutreachAnalytics = useCallback(async (): Promise<any> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/agents/insights/outreach-analytics')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch outreach analytics: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch outreach analytics'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/v1/agents/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`Workflow creation failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Workflow creation failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const executeWorkflow = useCallback(async (workflowId: string): Promise<WorkflowExecution> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/agents/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Workflow execution failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Workflow execution failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getWorkflowStatus = useCallback(async (workflowId: string): Promise<WorkflowExecution> => {
    try {
      const response = await fetch(`/api/v1/agents/workflows/${workflowId}/status`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow status: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workflow status'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Comprehensive Agent Insights
  const getAgentInsights = useCallback(async (): Promise<AgentInsights> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/agents/insights/comprehensive')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent insights: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agent insights'
      setError(errorMessage)
      throw new Error(errorMessage)
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
      const response = await fetch('/api/v1/agents/workflows/reverse-talent-radar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_type: 'reverse_talent_radar',
          parameters: params
        })
      })

      if (!response.ok) {
        throw new Error(`Reverse talent radar failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reverse talent radar execution failed'
      setError(errorMessage)
      throw new Error(errorMessage)
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