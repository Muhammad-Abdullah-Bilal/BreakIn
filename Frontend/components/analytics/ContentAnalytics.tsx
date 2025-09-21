'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/services/identity-api';
import { ContentAnalytics, DateRange, ChartData } from '@/lib/types/analytics';
import { Article } from '@/lib/types/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Share,
  Bookmark,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Target,
  Hash,
  Users,
  Star,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';

interface ContentStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const ContentStatsCard: React.FC<ContentStatsCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : change < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TopContentProps {
  articles: Article[];
  metric: string;
  isLoading?: boolean;
}

const TopContent: React.FC<TopContentProps> = ({ articles, metric, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-16 h-12 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-6 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const getMetricValue = (article: Article) => {
    switch (metric) {
      case 'views':
        return article.views;
      case 'likes':
        return article.likesCount;
      case 'comments':
        return article.commentsCount;
      case 'bookmarks':
        return article.bookmarksCount;
      case 'engagement':
        return Math.round(((article.likesCount + article.commentsCount + article.bookmarksCount) / article.views) * 100);
      default:
        return article.views;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'views':
        return 'views';
      case 'likes':
        return 'likes';
      case 'comments':
        return 'comments';
      case 'bookmarks':
        return 'bookmarks';
      case 'engagement':
        return '% engagement';
      default:
        return 'views';
    }
  };

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-6">
              #{index + 1}
            </span>
            {article.featuredImage ? (
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-16 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {article.difficulty}
              </Badge>
            </div>
            <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
              <Link href={`/knowledge-base/${article.slug}`}>
                {article.title}
              </Link>
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={article.author.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {article.author.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{article.author.displayName}</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-bold">{getMetricValue(article).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{getMetricLabel(metric)}</p>
          </div>
          
          <Button asChild variant="ghost" size="sm">
            <Link href={`/knowledge-base/${article.slug}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
};

interface CategoryPerformanceProps {
  data: ChartData[];
  isLoading?: boolean;
}

const CategoryPerformance: React.FC<CategoryPerformanceProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="h-64 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {data.map((category, index) => (
        <div key={category.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{category.label}</span>
            </div>
            <span className="text-sm font-bold">{category.value.toLocaleString()} views</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${(category.value / (data[0]?.value || 1)) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export function ContentAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  // Date range options
  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  // Content metrics
  const contentMetrics = [
    { value: 'views', label: 'Views' },
    { value: 'likes', label: 'Likes' },
    { value: 'comments', label: 'Comments' },
    { value: 'bookmarks', label: 'Bookmarks' },
    { value: 'engagement', label: 'Engagement Rate' },
  ];

  // Fetch content analytics overview
  const { 
    data: contentOverview, 
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview 
  } = useQuery({
    queryKey: ['contentAnalyticsOverview', dateRange],
    queryFn: () => analyticsService.getContentAnalyticsOverview(dateRange),
  });

  // Fetch top content
  const { 
    data: topContent, 
    isLoading: topContentLoading 
  } = useQuery({
    queryKey: ['topContent', dateRange, selectedMetric, selectedCategory],
    queryFn: () => analyticsService.getTopContent(dateRange, {
      metric: selectedMetric,
      category: selectedCategory,
      limit: 20,
    }),
  });

  // Fetch content performance data
  const { 
    data: performanceData, 
    isLoading: performanceLoading 
  } = useQuery({
    queryKey: ['contentPerformanceData', dateRange],
    queryFn: () => analyticsService.getContentPerformanceData(dateRange),
  });

  // Fetch category analytics
  const { 
    data: categoryData, 
    isLoading: categoryLoading 
  } = useQuery({
    queryKey: ['categoryAnalytics', dateRange],
    queryFn: () => analyticsService.getCategoryAnalytics(dateRange),
  });

  // Fetch content trends
  const { 
    data: trendData, 
    isLoading: trendLoading 
  } = useQuery({
    queryKey: ['contentTrends', dateRange],
    queryFn: () => analyticsService.getContentTrends(dateRange),
  });

  const handleRefresh = async () => {
    try {
      await refetchOverview();
      toast({
        title: 'Data refreshed',
        description: 'Content analytics data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh content analytics.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your content analytics report is being prepared.',
    });
  };

  if (overviewError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Content Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the content analytics data.
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
          <h1 className="text-3xl font-bold">Content Analytics</h1>
          <p className="text-muted-foreground">
            Track content performance and engagement metrics
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <ContentStatsCard
          title="Total Content"
          value={contentOverview?.totalArticles?.toLocaleString() || '0'}
          change={contentOverview?.totalArticlesChange}
          icon={<FileText className="h-6 w-6 text-white" />}
          color="bg-blue-500"
          isLoading={overviewLoading}
        />
        
        <ContentStatsCard
          title="Total Views"
          value={contentOverview?.totalViews?.toLocaleString() || '0'}
          change={contentOverview?.totalViewsChange}
          icon={<Eye className="h-6 w-6 text-white" />}
          color="bg-green-500"
          isLoading={overviewLoading}
        />
        
        <ContentStatsCard
          title="Total Engagement"
          value={contentOverview?.totalEngagement?.toLocaleString() || '0'}
          change={contentOverview?.totalEngagementChange}
          icon={<Heart className="h-6 w-6 text-white" />}
          color="bg-red-500"
          isLoading={overviewLoading}
        />
        
        <ContentStatsCard
          title="Avg Reading Time"
          value={contentOverview?.avgReadingTime || '0m'}
          change={contentOverview?.avgReadingTimeChange}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-purple-500"
          isLoading={overviewLoading}
        />
        
        <ContentStatsCard
          title="Engagement Rate"
          value={contentOverview?.engagementRate ? `${contentOverview.engagementRate.toFixed(1)}%` : '0%'}
          change={contentOverview?.engagementRateChange}
          icon={<Target className="h-6 w-6 text-white" />}
          color="bg-orange-500"
          isLoading={overviewLoading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="top-content">Top Content</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Views Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Content Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData?.viewsOverTime || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f620" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData?.engagementMetrics || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} name="Likes" />
                        <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} name="Comments" />
                        <Line type="monotone" dataKey="bookmarks" stroke="#10b981" strokeWidth={2} name="Bookmarks" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reading Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData?.readingTimeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="space-y-4">
                    {performanceData?.publishingPerformance?.map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.dayOfWeek}</span>
                          <span className="text-sm text-muted-foreground">
                            {day.avgViews.toLocaleString()} avg views
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {day.hourlyData.map((hour, hourIndex) => (
                            <div
                              key={hourIndex}
                              className="flex-1 h-6 rounded"
                              style={{
                                backgroundColor: `hsl(220, 70%, ${Math.max(20, 100 - (hour.views / day.maxViews) * 80)}%)`,
                              }}
                              title={`${hour.hour}:00 - ${hour.views} views`}
                            />
                          ))}
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Creation Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Content Creation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData?.contentCreation || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Tags Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="space-y-3">
                    {trendData?.popularTags?.slice(0, 10).map((tag, index) => (
                      <div key={tag.label} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tag.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${(tag.value / (trendData?.popularTags?.[0]?.value || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-12 text-right">
                            {tag.value}
                          </span>
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trendData?.contentTypes || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(trendData?.contentTypes || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData?.engagementRate || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                        <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPerformance data={categoryData || []} isLoading={categoryLoading} />
              </CardContent>
            </Card>

            {/* Category Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Category Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-content" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentMetrics.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tutorials">Tutorials</SelectItem>
                    <SelectItem value="guides">Guides</SelectItem>
                    <SelectItem value="articles">Articles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Top Content List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Content by {contentMetrics.find(m => m.value === selectedMetric)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopContent 
                articles={topContent || []} 
                metric={selectedMetric}
                isLoading={topContentLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}