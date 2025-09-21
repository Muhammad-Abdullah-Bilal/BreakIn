'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/services/identity-api';
import { KPIMetric, ChartData, CohortMetric, DateRange } from '@/lib/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Eye,
  MessageSquare,
  FileText,
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  Globe,
  Heart,
  Bookmark,
  ThumbsUp,
  Share
} from 'lucide-react';
import { formatDistanceToNow, format, subDays, subWeeks, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface KPICardProps {
  metric: KPIMetric;
  isLoading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ metric, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (category: string) => {
    switch (category) {
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'engagement':
        return <Activity className="h-5 w-5" />;
      case 'content':
        return <FileText className="h-5 w-5" />;
      case 'performance':
        return <Target className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getIconColor = (category: string) => {
    switch (category) {
      case 'users':
        return 'text-blue-600';
      case 'engagement':
        return 'text-green-600';
      case 'content':
        return 'text-purple-600';
      case 'performance':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (metric.trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (metric.trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-muted/50 ${getIconColor(metric.category)}`}>
                {getIcon(metric.category)}
              </div>
              <div>
                <h3 className="font-medium text-sm">{metric.label}</h3>
                <Badge variant="outline" className="text-xs">
                  {metric.category}
                </Badge>
              </div>
            </div>
            {getTrendIcon()}
          </div>

          {/* Value */}
          <div className="space-y-1">
            <p className="text-3xl font-bold">{metric.displayValue}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className={getTrendColor()}>
                {metric.changePercent !== undefined && (
                  <>
                    {metric.changePercent > 0 ? '+' : ''}
                    {metric.changePercent.toFixed(1)}%
                  </>
                )}
              </span>
              <span className="text-muted-foreground">
                vs {metric.comparisonPeriod}
              </span>
            </div>
          </div>

          {/* Description */}
          {metric.description && (
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          )}

          {/* Target Progress */}
          {metric.target && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress to target</span>
                <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  data: ChartData[];
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKey: string;
  color?: string;
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  data, 
  type, 
  dataKey, 
  color = '#3b82f6',
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={`${color}20`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'pie':
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['users', 'engagement', 'content']);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  // Date range options
  const dateRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  // Fetch KPI metrics
  const { 
    data: kpiMetrics, 
    isLoading: kpiLoading, 
    isError: kpiError,
    refetch: refetchKPIs 
  } = useQuery({
    queryKey: ['kpiMetrics', dateRange],
    queryFn: () => analyticsService.getKPIMetrics(dateRange),
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
  });

  // Fetch chart data
  const { 
    data: chartData, 
    isLoading: chartLoading,
    isError: chartError,
    refetch: refetchCharts 
  } = useQuery({
    queryKey: ['chartData', dateRange],
    queryFn: () => analyticsService.getChartData(dateRange),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch cohort data
  const { 
    data: cohortData, 
    isLoading: cohortLoading 
  } = useQuery({
    queryKey: ['cohortMetrics', dateRange],
    queryFn: () => analyticsService.getCohortMetrics(dateRange),
  });

  // Filter metrics based on selection
  const filteredKPIs = useMemo(() => {
    if (!kpiMetrics) return [];
    return kpiMetrics.filter(metric => selectedMetrics.includes(metric.category));
  }, [kpiMetrics, selectedMetrics]);

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchKPIs(), refetchCharts()]);
      toast({
        title: 'Data refreshed',
        description: 'Analytics data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh analytics data.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    toast({
      title: 'Export started',
      description: 'Your analytics report is being prepared.',
    });
  };

  const toggleMetricCategory = (category: string) => {
    setSelectedMetrics(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (kpiError || chartError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the analytics data.
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your platform's performance and user engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-48">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
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

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Show metrics:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['users', 'engagement', 'content', 'performance'].map((category) => (
                <Button
                  key={category}
                  variant={selectedMetrics.includes(category) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMetricCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <KPICard key={i} metric={{} as KPIMetric} isLoading={true} />
          ))
        ) : (
          filteredKPIs.map((metric) => (
            <KPICard key={metric.id} metric={metric} />
          ))
        )}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData && (
              <>
                <ChartCard
                  title="Daily Active Users"
                  data={chartData.userActivity || []}
                  type="area"
                  dataKey="value"
                  color="#3b82f6"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Content Views"
                  data={chartData.contentViews || []}
                  type="line"
                  dataKey="value"
                  color="#10b981"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="User Engagement"
                  data={chartData.engagement || []}
                  type="bar"
                  dataKey="value"
                  color="#f59e0b"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Content Distribution"
                  data={chartData.contentTypes || []}
                  type="pie"
                  dataKey="value"
                  isLoading={chartLoading}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData && (
              <>
                <ChartCard
                  title="User Registration Trend"
                  data={chartData.userRegistrations || []}
                  type="area"
                  dataKey="value"
                  color="#8b5cf6"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="User Retention"
                  data={chartData.userRetention || []}
                  type="line"
                  dataKey="value"
                  color="#ec4899"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="User Roles Distribution"
                  data={chartData.userRoles || []}
                  type="pie"
                  dataKey="value"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Session Duration"
                  data={chartData.sessionDuration || []}
                  type="bar"
                  dataKey="value"
                  color="#06b6d4"
                  isLoading={chartLoading}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData && (
              <>
                <ChartCard
                  title="Content Creation"
                  data={chartData.contentCreation || []}
                  type="bar"
                  dataKey="value"
                  color="#10b981"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Popular Categories"
                  data={chartData.popularCategories || []}
                  type="pie"
                  dataKey="value"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Content Performance"
                  data={chartData.contentPerformance || []}
                  type="line"
                  dataKey="value"
                  color="#f59e0b"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Reading Time Distribution"
                  data={chartData.readingTime || []}
                  type="area"
                  dataKey="value"
                  color="#ef4444"
                  isLoading={chartLoading}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData && (
              <>
                <ChartCard
                  title="Comments & Replies"
                  data={chartData.comments || []}
                  type="area"
                  dataKey="value"
                  color="#8b5cf6"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Likes & Reactions"
                  data={chartData.likes || []}
                  type="bar"
                  dataKey="value"
                  color="#ec4899"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Shares & Bookmarks"
                  data={chartData.shares || []}
                  type="line"
                  dataKey="value"
                  color="#06b6d4"
                  isLoading={chartLoading}
                />
                <ChartCard
                  title="Engagement Rate"
                  data={chartData.engagementRate || []}
                  type="area"
                  dataKey="value"
                  color="#84cc16"
                  isLoading={chartLoading}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cohort Analysis */}
      {cohortData && (
        <Card>
          <CardHeader>
            <CardTitle>User Cohort Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track user retention across different cohorts
            </p>
          </CardHeader>
          <CardContent>
            {cohortLoading ? (
              <div className="h-64 bg-muted rounded animate-pulse" />
            ) : (
              <div className="space-y-4">
                {cohortData.map((cohort, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cohort.period}</span>
                      <span className="text-sm text-muted-foreground">
                        {cohort.users} users
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {cohort.retentionRates.map((rate, i) => (
                        <div
                          key={i}
                          className="flex-1 h-8 rounded flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `hsl(${120 * rate / 100}, 70%, 50%)`,
                            opacity: 0.8,
                          }}
                        >
                          {rate.toFixed(0)}%
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
        <Card>
          <CardContent className="p-4">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'total_users')?.displayValue || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'total_posts')?.displayValue || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <FileText className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'total_articles')?.displayValue || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Articles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Eye className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'total_views')?.displayValue || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Page Views</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-pink-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'total_likes')?.displayValue || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Likes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Activity className="h-6 w-6 mx-auto mb-2 text-cyan-600" />
            <p className="text-xl font-bold">
              {kpiMetrics?.find(m => m.id === 'engagement_rate')?.displayValue || '0%'}
            </p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}