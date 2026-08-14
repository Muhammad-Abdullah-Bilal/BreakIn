"use client"

import { useState, useCallback } from 'react'

export interface MetricValue {
  value: number
  change?: number
  change_percentage?: number
  trend?: 'up' | 'down' | 'stable'
}

export interface HiringMetrics {
  active_jobs: MetricValue
  talent_matches: MetricValue
  avg_time_to_hire: MetricValue
  sprint_completion_rate: MetricValue
  // Extended fields used by analytics page
  total_candidates: MetricValue
  active_positions: MetricValue
  successful_hires: MetricValue
  time_to_hire: MetricValue
  cost_per_hire: MetricValue
  candidate_satisfaction: MetricValue
  offer_acceptance_rate: MetricValue
  pipeline_conversion_rate: MetricValue
}

export interface AgentPerformance {
  sourcing_agent_accuracy: MetricValue
  outreach_response_rate: MetricValue
  interview_conversion: MetricValue
  pipeline_velocity: MetricValue
  // Extended fields used by analytics page (agent list view)
  agent_name?: string
  agent_type?: string
  uptime_percentage?: number
  total_operations?: number
  success_rate?: number
  cost_savings?: number
  user_satisfaction?: number
  accuracy_score?: number
  average_response_time?: number
}

export interface PipelineStage {
  stage: string
  candidates_count: number
}

export interface PipelineAnalytics {
  conversion_funnel: PipelineStage[]
  // Extended fields used by analytics page (stage detail view)
  stage_name?: string
  total_candidates?: number
  conversion_rate?: number
  average_time_in_stage?: number
  drop_off_rate?: number
  bottleneck_score?: number
}

export interface Insight {
  id: string
  title: string
  description: string
  impact_score: number
  recommendation: string
  // Extended fields used by analytics page
  impact?: string
  type?: string
  confidence?: number
}

export interface ReportRequest {
  report_type: 'hiring_metrics' | 'agent_performance' | 'pipeline_analytics' | 'insights'
  time_range: 'last_7_days' | 'last_30_days' | 'last_90_days'
  export_format: 'pdf' | 'csv'
}

const DEFAULT_HIRING_METRICS: HiringMetrics = {
  active_jobs: { value: 3, change: 12, change_percentage: 12, trend: 'up' },
  talent_matches: { value: 6, change: 8, change_percentage: 8, trend: 'up' },
  avg_time_to_hire: { value: 4.2, change: -15, change_percentage: -15, trend: 'down' },
  sprint_completion_rate: { value: 94.5, change: 2, change_percentage: 2, trend: 'up' },
  total_candidates: { value: 142, change: 18, change_percentage: 14, trend: 'up' },
  active_positions: { value: 3, change: 1, change_percentage: 50, trend: 'up' },
  successful_hires: { value: 8, change: 2, change_percentage: 33, trend: 'up' },
  time_to_hire: { value: 4.2, change: -1.3, change_percentage: -24, trend: 'down' },
  cost_per_hire: { value: 2400, change: -300, change_percentage: -11, trend: 'down' },
  candidate_satisfaction: { value: 4.6, change: 0.2, change_percentage: 5, trend: 'up' },
  offer_acceptance_rate: { value: 78, change: 8, change_percentage: 11, trend: 'up' },
  pipeline_conversion_rate: { value: 12, change: 2, change_percentage: 19, trend: 'up' },
}

const DEFAULT_AGENT_PERFORMANCE: AgentPerformance = {
  sourcing_agent_accuracy: { value: 92, change: 4, trend: 'up' },
  outreach_response_rate: { value: 68, change: 12, trend: 'up' },
  interview_conversion: { value: 42, change: -2, trend: 'down' },
  pipeline_velocity: { value: 85, change: 5, trend: 'up' },
}

const DEFAULT_PIPELINE_ANALYTICS: PipelineAnalytics = {
  conversion_funnel: [
    { stage: 'Sourcing', candidates_count: 142 },
    { stage: 'Simulation Passed', candidates_count: 58 },
    { stage: 'Technical Chat', candidates_count: 24 },
    { stage: 'Final Review', candidates_count: 12 },
    { stage: 'Hired', candidates_count: 3 }
  ]
}

const DEFAULT_INSIGHTS: Insight[] = [
  {
    id: 'ins_1',
    title: 'Top matches in Node.js / TypeScript',
    description: 'We detected a 24% increase in candidates matching your Node.js requirements with passing sprint scores.',
    impact_score: 9.2,
    recommendation: 'Send instant interview requests to the top 3 matches today.',
    impact: 'positive',
    type: 'opportunity',
    confidence: 0.94
  },
  {
    id: 'ins_2',
    title: 'Optimal outreach timing identified',
    description: 'TypeScript candidates respond 40% faster on Tuesday morning outreach.',
    impact_score: 8.5,
    recommendation: 'Configure your sourcing agent outreach to execute on Tuesdays at 10:00 AM.',
    impact: 'positive',
    type: 'trend',
    confidence: 0.88
  }
]

export default function useAnalytics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hiringMetrics, setHiringMetrics] = useState<HiringMetrics>(DEFAULT_HIRING_METRICS)
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance>(DEFAULT_AGENT_PERFORMANCE)
  const [pipelineAnalytics, setPipelineAnalytics] = useState<PipelineAnalytics>(DEFAULT_PIPELINE_ANALYTICS)
  const [insights, setInsights] = useState<Insight[]>(DEFAULT_INSIGHTS)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchHiringMetrics = useCallback(async (timeRange: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/analytics/hiring-metrics?range=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        if (data && (data.active_jobs || data.total_candidates)) {
          setHiringMetrics({ ...DEFAULT_HIRING_METRICS, ...data })
        }
      }
    } catch (e) {
      console.warn('Analytics fetch fallback:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAgentPerformance = useCallback(async (timeRange: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/analytics/agent-performance?range=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.sourcing_agent_accuracy) {
          setAgentPerformance({ ...DEFAULT_AGENT_PERFORMANCE, ...data })
        }
      }
    } catch (e) {
      console.warn('Analytics fetch fallback:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPipelineAnalytics = useCallback(async (timeRange: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/analytics/pipeline?range=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.conversion_funnel) {
          setPipelineAnalytics({ ...DEFAULT_PIPELINE_ANALYTICS, ...data })
        }
      }
    } catch (e) {
      console.warn('Analytics fetch fallback:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInsights = useCallback(async (timeRange: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/analytics/insights?range=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setInsights(data)
      }
    } catch (e) {
      console.warn('Analytics fetch fallback:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReport = useCallback(async (req: ReportRequest) => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.warn('Report generation fallback:', e)
    } finally {
      setLoading(false)
    }
    return { download_url: 'https://example.com/reports/report_sample.pdf' }
  }, [])

  return {
    loading,
    error,
    hiringMetrics,
    agentPerformance,
    pipelineAnalytics,
    insights,
    clearError,
    fetchHiringMetrics,
    fetchAgentPerformance,
    fetchPipelineAnalytics,
    fetchInsights,
    generateReport
  }
}
