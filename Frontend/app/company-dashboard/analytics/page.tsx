'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  Target,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Activity,
  Zap,
  Brain,
  Filter,
  Calendar,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react'
import useAnalytics, {
  HiringMetrics,
  AgentPerformance,
  PipelineAnalytics,
  Insight,
  ReportRequest,
  MetricValue
} from '@/hooks/useAnalytics'

interface MetricCardProps {
  title: string
  metric: MetricValue
  icon: React.ReactNode
  unit?: string
  format?: 'number' | 'currency' | 'percentage' | 'rating' | 'days'
}

function MetricCard({ title, metric, icon, unit, format = 'number' }: MetricCardProps) {
  const formatValue = (value: number, format: string, unit?: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value}%`
      case 'rating':
        return `${value}/5`
      case 'days':
        return `${value} days`
      default:
        return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString()
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(metric.value, format, unit)}
        </div>
        {metric.change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor(metric.trend)}`}>
            {getTrendIcon(metric.trend)}
            <span className="ml-1">
              {metric.change > 0 ? '+' : ''}{metric.change} ({metric.change_percentage}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface InsightCardProps {
  insight: Insight
}

function InsightCard({ insight }: InsightCardProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-5 w-5" />
      case 'bottleneck': return <AlertTriangle className="h-5 w-5" />
      case 'opportunity': return <Lightbulb className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'border-green-200 bg-green-50'
      case 'negative': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={`${getInsightColor(insight.impact)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getInsightIcon(insight.type)}
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">Confidence</div>
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence)}`}></div>
            <div className="text-xs font-medium">{Math.round(insight.confidence * 100)}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
        <div className="bg-white p-3 rounded-md border">
          <div className="text-xs font-medium text-gray-500 mb-1">Recommendation</div>
          <p className="text-sm">{insight.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface AgentPerformanceCardProps {
  agent: AgentPerformance
}

function AgentPerformanceCard({ agent }: AgentPerformanceCardProps) {
  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'job_radar': return <Target className="h-5 w-5" />
      case 'talent_matching': return <Users className="h-5 w-5" />
      case 'outreach': return <Zap className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getAgentIcon(agent.agent_type)}
            <div>
              <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
              <CardDescription className="capitalize">{agent.agent_type.replace('_', ' ')}</CardDescription>
            </div>
          </div>
          <Badge variant={agent.uptime_percentage > 99 ? 'default' : 'secondary'}>
            {agent.uptime_percentage}% Uptime
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{agent.total_operations.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Operations</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{agent.success_rate}%</div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${agent.cost_savings.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Cost Savings</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{agent.user_satisfaction}/5</div>
            <div className="text-xs text-gray-500">User Rating</div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Accuracy Score</span>
            <span>{agent.accuracy_score}%</span>
          </div>
          <Progress value={agent.accuracy_score} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>Response Time</span>
            <span>{agent.average_response_time}s avg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PipelineStageCardProps {
  stage: PipelineAnalytics
}

function PipelineStageCard({ stage }: PipelineStageCardProps) {
  const getBottleneckColor = (score: number) => {
    if (score > 50) return 'text-red-600'
    if (score > 25) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{stage.stage_name}</CardTitle>
        <CardDescription>{stage.total_candidates} candidates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{stage.conversion_rate}%</div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stage.average_time_in_stage} days</div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Drop-off Rate</span>
            <span>{stage.drop_off_rate}%</span>
          </div>
          <Progress value={100 - stage.drop_off_rate} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>Bottleneck Score</span>
            <span className={getBottleneckColor(stage.bottleneck_score)}>
              {stage.bottleneck_score}/100
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const {
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
  } = useAnalytics()

  const [timeRange, setTimeRange] = useState('last_30_days')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportType, setReportType] = useState<ReportRequest['report_type']>('hiring_metrics')
  const [exportFormat, setExportFormat] = useState<ReportRequest['export_format']>('pdf')

  useEffect(() => {
    fetchHiringMetrics(timeRange)
    fetchAgentPerformance(timeRange)
    fetchPipelineAnalytics(timeRange)
    fetchInsights(timeRange)
  }, [timeRange, fetchHiringMetrics, fetchAgentPerformance, fetchPipelineAnalytics, fetchInsights])

  const handleRefresh = () => {
    fetchHiringMetrics(timeRange)
    fetchAgentPerformance(timeRange)
    fetchPipelineAnalytics(timeRange)
    fetchInsights(timeRange)
  }

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      const reportRequest: ReportRequest = {
        report_type: reportType,
        time_range: timeRange as ReportRequest['time_range'],
        export_format: exportFormat
      }
      
      const result = await generateReport(reportRequest)
      if (result) {
        // In a real implementation, you would handle the download
        alert(`Report generated successfully! Download URL: ${result.download_url}`)
      }
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setReportLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={clearError}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600">Track hiring performance and generate insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_6_months">Last 6 months</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {hiringMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Total Candidates"
                metric={hiringMetrics.total_candidates}
                icon={<Users className="h-4 w-4 text-blue-600" />}
              />
              <MetricCard
                title="Active Positions"
                metric={hiringMetrics.active_positions}
                icon={<Briefcase className="h-4 w-4 text-green-600" />}
              />
              <MetricCard
                title="Successful Hires"
                metric={hiringMetrics.successful_hires}
                icon={<CheckCircle className="h-4 w-4 text-purple-600" />}
              />
              <MetricCard
                title="Time to Hire"
                metric={hiringMetrics.time_to_hire}
                icon={<Clock className="h-4 w-4 text-orange-600" />}
                format="days"
              />
              <MetricCard
                title="Cost per Hire"
                metric={hiringMetrics.cost_per_hire}
                icon={<DollarSign className="h-4 w-4 text-red-600" />}
                format="currency"
              />
              <MetricCard
                title="Candidate Satisfaction"
                metric={hiringMetrics.candidate_satisfaction}
                icon={<Star className="h-4 w-4 text-yellow-600" />}
                format="rating"
              />
              <MetricCard
                title="Offer Acceptance Rate"
                metric={hiringMetrics.offer_acceptance_rate}
                icon={<Target className="h-4 w-4 text-indigo-600" />}
                format="percentage"
              />
              <MetricCard
                title="Pipeline Conversion"
                metric={hiringMetrics.pipeline_conversion_rate}
                icon={<BarChart3 className="h-4 w-4 text-teal-600" />}
                format="percentage"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agentPerformance.map((agent, index) => (
              <AgentPerformanceCard key={index} agent={agent} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pipelineAnalytics.map((stage, index) => (
              <PipelineStageCard key={index} stage={stage} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Create detailed reports for your hiring analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: ReportRequest['report_type']) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hiring_metrics">Hiring Metrics</SelectItem>
                      <SelectItem value="candidate_performance">Candidate Performance</SelectItem>
                      <SelectItem value="sprint_analytics">Sprint Analytics</SelectItem>
                      <SelectItem value="agent_performance">Agent Performance</SelectItem>
                      <SelectItem value="pipeline_analytics">Pipeline Analytics</SelectItem>
                      <SelectItem value="cost_analysis">Cost Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7_days">Last 7 days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 days</SelectItem>
                      <SelectItem value="last_6_months">Last 6 months</SelectItem>
                      <SelectItem value="last_year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: ReportRequest['export_format']) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleGenerateReport} 
                disabled={reportLoading}
                className="w-full md:w-auto"
              >
                <Download className={`h-4 w-4 mr-2 ${reportLoading ? 'animate-spin' : ''}`} />
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}