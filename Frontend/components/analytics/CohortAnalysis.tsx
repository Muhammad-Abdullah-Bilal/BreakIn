'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/services/identity-api';
import { CohortMetric, DateRange } from '@/lib/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { 
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Info,
  Target,
  Activity,
  Clock,
  Percent,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, subDays, subWeeks, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface CohortTableProps {
  cohorts: CohortMetric[];
  isLoading?: boolean;
}

const CohortTable: React.FC<CohortTableProps> = ({ cohorts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-24 h-10 bg-muted rounded animate-pulse" />
            <div className="w-16 h-10 bg-muted rounded animate-pulse" />
            {Array.from({ length: 12 }).map((_, j) => (
              <div key={j} className="w-12 h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Cohort Data</h3>
        <p className="text-muted-foreground">
          No cohort data available for the selected period.
        </p>
      </div>
    );
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-green-400';
    if (rate >= 40) return 'bg-yellow-400';
    if (rate >= 20) return 'bg-orange-400';
    if (rate >= 10) return 'bg-red-400';
    return 'bg-red-500';
  };

  const getRetentionIntensity = (rate: number) => {
    return Math.max(0.2, rate / 100); // Minimum 20% opacity
  };

  const maxPeriods = Math.max(...cohorts.map(c => c.retentionRates.length));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm font-medium">Cohort Period</div>
        <div className="text-sm font-medium w-16">Users</div>
        <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-center">
          {Array.from({ length: maxPeriods }).map((_, i) => (
            <div key={i} className="font-medium">
              Week {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Rows */}
      <div className="space-y-2">
        {cohorts.map((cohort, index) => (
          <div key={index} className="flex items-center gap-4 p-2 hover:bg-muted/30 rounded-lg transition-colors">
            {/* Period */}
            <div className="text-sm font-medium w-24">
              {format(parseISO(cohort.period), 'MMM dd')}
            </div>
            
            {/* User Count */}
            <div className="text-sm w-16 text-center">
              <Badge variant="outline" className="text-xs">
                {cohort.users.toLocaleString()}
              </Badge>
            </div>
            
            {/* Retention Rates */}
            <div className="flex-1 grid grid-cols-12 gap-1">
              {cohort.retentionRates.map((rate, periodIndex) => (
                <div
                  key={periodIndex}
                  className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white transition-all hover:scale-105 cursor-pointer ${getRetentionColor(rate)}`}
                  style={{ opacity: getRetentionIntensity(rate) }}
                  title={`Week ${periodIndex + 1}: ${rate.toFixed(1)}% retention`}
                >
                  {rate.toFixed(0)}%
                </div>
              ))}
              
              {/* Fill empty cells */}
              {Array.from({ length: maxPeriods - cohort.retentionRates.length }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 bg-muted/20 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>80%+ retention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded" />
          <span>40-79% retention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded" />
          <span>&lt;40% retention</span>
        </div>
      </div>
    </div>
  );
};

interface RetentionTrendProps {
  cohorts: CohortMetric[];
  isLoading?: boolean;
}

const RetentionTrend: React.FC<RetentionTrendProps> = ({ cohorts, isLoading }) => {
  const trendData = useMemo(() => {
    if (!cohorts || cohorts.length === 0) return [];
    
    const maxPeriods = Math.max(...cohorts.map(c => c.retentionRates.length));
    
    return Array.from({ length: maxPeriods }).map((_, periodIndex) => {
      const periodData = {
        period: `Week ${periodIndex + 1}`,
        average: 0,
        min: 100,
        max: 0,
        count: 0,
      };
      
      cohorts.forEach(cohort => {
        if (cohort.retentionRates[periodIndex] !== undefined) {
          const rate = cohort.retentionRates[periodIndex];
          periodData.average += rate;
          periodData.min = Math.min(periodData.min, rate);
          periodData.max = Math.max(periodData.max, rate);
          periodData.count++;
        }
      });
      
      if (periodData.count > 0) {
        periodData.average = periodData.average / periodData.count;
      }
      
      return periodData;
    });
  }, [cohorts]);

  if (isLoading) {
    return <div className="h-64 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="average" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Average Retention"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="max" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Best Cohort"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="min" 
            stroke="#ef4444" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Worst Cohort"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface CohortStatsProps {
  cohorts: CohortMetric[];
  isLoading?: boolean;
}

const CohortStats: React.FC<CohortStatsProps> = ({ cohorts, isLoading }) => {
  const stats = useMemo(() => {
    if (!cohorts || cohorts.length === 0) {
      return {
        totalUsers: 0,
        avgWeek1Retention: 0,
        avgWeek4Retention: 0,
        bestCohort: null,
        worstCohort: null,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const totalUsers = cohorts.reduce((sum, cohort) => sum + cohort.users, 0);
    
    // Calculate average retention rates
    const week1Rates = cohorts.map(c => c.retentionRates[0]).filter(r => r !== undefined);
    const week4Rates = cohorts.map(c => c.retentionRates[3]).filter(r => r !== undefined);
    
    const avgWeek1Retention = week1Rates.length > 0 
      ? week1Rates.reduce((sum, rate) => sum + rate, 0) / week1Rates.length 
      : 0;
    
    const avgWeek4Retention = week4Rates.length > 0
      ? week4Rates.reduce((sum, rate) => sum + rate, 0) / week4Rates.length
      : 0;

    // Find best and worst cohorts based on Week 4 retention
    let bestCohort = null;
    let worstCohort = null;
    let bestRate = 0;
    let worstRate = 100;

    cohorts.forEach(cohort => {
      const week4Rate = cohort.retentionRates[3];
      if (week4Rate !== undefined) {
        if (week4Rate > bestRate) {
          bestRate = week4Rate;
          bestCohort = cohort;
        }
        if (week4Rate < worstRate) {
          worstRate = week4Rate;
          worstCohort = cohort;
        }
      }
    });

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (cohorts.length >= 3) {
      const recentCohorts = cohorts.slice(-3);
      const olderCohorts = cohorts.slice(0, -3);
      
      if (recentCohorts.length > 0 && olderCohorts.length > 0) {
        const recentAvg = recentCohorts.reduce((sum, c) => sum + (c.retentionRates[0] || 0), 0) / recentCohorts.length;
        const olderAvg = olderCohorts.reduce((sum, c) => sum + (c.retentionRates[0] || 0), 0) / olderCohorts.length;
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }
    }

    return {
      totalUsers,
      avgWeek1Retention,
      avgWeek4Retention,
      bestCohort,
      worstCohort,
      trend,
    };
  }, [cohorts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Across all cohorts</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Week 1 Retention</h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{stats.avgWeek1Retention.toFixed(1)}%</p>
            {getTrendIcon()}
          </div>
          <p className={`text-sm ${getTrendColor()}`}>
            Average across cohorts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium">Week 4 Retention</h3>
          </div>
          <p className="text-2xl font-bold">{stats.avgWeek4Retention.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">
            Long-term retention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">Best Cohort</h3>
          </div>
          {stats.bestCohort ? (
            <>
              <p className="text-2xl font-bold">
                {stats.bestCohort.retentionRates[3]?.toFixed(1) || 'N/A'}%
              </p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(stats.bestCohort.period), 'MMM dd')} cohort
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export function CohortAnalysis() {
  const [dateRange, setDateRange] = useState<DateRange>('90d');
  const [cohortType, setCohortType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedView, setSelectedView] = useState<'table' | 'trend'>('table');
  const { toast } = useToast();

  // Date range options
  const dateRangeOptions = [
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '180d', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' },
  ];

  // Fetch cohort data
  const { 
    data: cohortData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['cohortMetrics', dateRange, cohortType],
    queryFn: () => analyticsService.getCohortMetrics(dateRange, { type: cohortType }),
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: 'Data refreshed',
        description: 'Cohort analysis data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh cohort data.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    toast({
      title: 'Export started',
      description: 'Your cohort analysis report is being prepared.',
    });
  };

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Cohort Data</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the cohort analysis.
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cohort Analysis</h1>
          <p className="text-muted-foreground">
            Track user retention and engagement over time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={cohortType} onValueChange={(value: 'weekly' | 'monthly') => setCohortType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">About Cohort Analysis</h3>
              <p className="text-sm text-blue-700 mt-1">
                This analysis shows how user retention changes over time. Each row represents a group of users who joined during the same period, 
                and the cells show what percentage of those users were still active in subsequent weeks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <CohortStats cohorts={cohortData || []} isLoading={isLoading} />

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(value: 'table' | 'trend') => setSelectedView(value)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table">Cohort Table</TabsTrigger>
            <TabsTrigger value="trend">Retention Trend</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Showing {cohortType} cohorts</span>
          </div>
        </div>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Retention Cohort Table</CardTitle>
              <p className="text-sm text-muted-foreground">
                Each cell shows the percentage of users from that cohort who were still active in the corresponding week.
              </p>
            </CardHeader>
            <CardContent>
              <CohortTable cohorts={cohortData || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Retention Trend Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare retention rates across different time periods to identify trends and patterns.
              </p>
            </CardHeader>
            <CardContent>
              <RetentionTrend cohorts={cohortData || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      {cohortData && cohortData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Strong Week 1 Retention</p>
                <p className="text-xs text-green-700">
                  Users who stay active in their first week have a higher likelihood of long-term retention.
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Onboarding Impact</p>
                <p className="text-xs text-blue-700">
                  Cohorts with better onboarding experiences show 15-20% higher retention rates.
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900">Critical Week 4</p>
                <p className="text-xs text-orange-700">
                  Week 4 is the critical retention milestone. Focus on engagement during this period.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Improve Week 1 Experience</p>
                <p className="text-xs text-muted-foreground">
                  Focus on onboarding flows and initial user value proposition.
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Enhance Engagement</p>
                <p className="text-xs text-muted-foreground">
                  Implement progressive disclosure and gamification elements.
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Re-engagement Campaigns</p>
                <p className="text-xs text-muted-foreground">
                  Target users at risk of churning with personalized content.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}