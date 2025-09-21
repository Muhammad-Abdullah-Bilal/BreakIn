'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/services/identity-api';
import { UserAnalytics, DateRange, ChartData } from '@/lib/types/analytics';
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
  Users,
  UserPlus,
  UserMinus,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Share,
  Heart,
  MessageSquare,
  Bookmark,
  Target,
  Zap,
  Crown,
  Star,
  Award,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface UserStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ 
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

interface TopUsersProps {
  users: UserAnalytics[];
  isLoading?: boolean;
}

const TopUsers: React.FC<TopUsersProps> = ({ users, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
            <div className="h-6 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-6">
              #{index + 1}
            </span>
            <Avatar>
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.displayName}</p>
              {user.role === 'mentor' && <Crown className="h-4 w-4 text-yellow-500" />}
              {user.isPremium && <Star className="h-4 w-4 text-purple-500" />}
            </div>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
          
          <div className="text-right">
            <p className="font-bold">{user.activityScore}</p>
            <p className="text-xs text-muted-foreground">Activity Score</p>
          </div>
        </div>
      ))}
    </div>
  );
};

interface DeviceBreakdownProps {
  data: ChartData[];
  isLoading?: boolean;
}

const DeviceBreakdown: React.FC<DeviceBreakdownProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="h-64 bg-muted rounded animate-pulse" />;
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between p-2 rounded">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="flex items-center gap-1">
                {getDeviceIcon(item.label)}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{item.value.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-1">users</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function UserAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('activity');
  
  const debouncedSearch = useDebounce(userSearchQuery, 300);
  const { toast } = useToast();

  // Date range options
  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  // User segments
  const userSegments = [
    { value: 'all', label: 'All Users' },
    { value: 'new', label: 'New Users' },
    { value: 'active', label: 'Active Users' },
    { value: 'inactive', label: 'Inactive Users' },
    { value: 'premium', label: 'Premium Users' },
    { value: 'mentors', label: 'Mentors' },
    { value: 'juniors', label: 'Juniors' },
  ];

  // Fetch user analytics overview
  const { 
    data: userOverview, 
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview 
  } = useQuery({
    queryKey: ['userAnalyticsOverview', dateRange],
    queryFn: () => analyticsService.getUserAnalyticsOverview(dateRange),
  });

  // Fetch top users
  const { 
    data: topUsers, 
    isLoading: topUsersLoading 
  } = useQuery({
    queryKey: ['topUsers', dateRange, selectedSegment, selectedMetric],
    queryFn: () => analyticsService.getTopUsers(dateRange, {
      segment: selectedSegment,
      metric: selectedMetric,
      limit: 20,
    }),
  });

  // Fetch user behavior data
  const { 
    data: behaviorData, 
    isLoading: behaviorLoading 
  } = useQuery({
    queryKey: ['userBehaviorData', dateRange],
    queryFn: () => analyticsService.getUserBehaviorData(dateRange),
  });

  // Fetch device analytics
  const { 
    data: deviceData, 
    isLoading: deviceLoading 
  } = useQuery({
    queryKey: ['deviceAnalytics', dateRange],
    queryFn: () => analyticsService.getDeviceAnalytics(dateRange),
  });

  // Fetch geographic data
  const { 
    data: geoData, 
    isLoading: geoLoading 
  } = useQuery({
    queryKey: ['geographicAnalytics', dateRange],
    queryFn: () => analyticsService.getGeographicAnalytics(dateRange),
  });

  const handleRefresh = async () => {
    try {
      await refetchOverview();
      toast({
        title: 'Data refreshed',
        description: 'User analytics data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh user analytics.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your user analytics report is being prepared.',
    });
  };

  if (overviewError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading User Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the user analytics data.
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
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into user behavior and engagement patterns
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatsCard
          title="Total Users"
          value={userOverview?.totalUsers?.toLocaleString() || '0'}
          change={userOverview?.totalUsersChange}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-blue-500"
          isLoading={overviewLoading}
        />
        
        <UserStatsCard
          title="New Users"
          value={userOverview?.newUsers?.toLocaleString() || '0'}
          change={userOverview?.newUsersChange}
          icon={<UserPlus className="h-6 w-6 text-white" />}
          color="bg-green-500"
          isLoading={overviewLoading}
        />
        
        <UserStatsCard
          title="Active Users"
          value={userOverview?.activeUsers?.toLocaleString() || '0'}
          change={userOverview?.activeUsersChange}
          icon={<Activity className="h-6 w-6 text-white" />}
          color="bg-orange-500"
          isLoading={overviewLoading}
        />
        
        <UserStatsCard
          title="Avg Session Time"
          value={userOverview?.avgSessionTime || '0m'}
          change={userOverview?.avgSessionTimeChange}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-purple-500"
          isLoading={overviewLoading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="behavior" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={behaviorData?.dailyActiveUsers || []}>
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

            {/* Session Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={behaviorData?.sessionDuration || []}>
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

            {/* Page Views */}
            <Card>
              <CardHeader>
                <CardTitle>Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={behaviorData?.pageViews || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Journey */}
            <Card>
              <CardHeader>
                <CardTitle>User Journey Flow</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="space-y-4">
                    {behaviorData?.userJourney?.map((step, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.page}</p>
                          <p className="text-sm text-muted-foreground">{step.visits.toLocaleString()} visits</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{step.conversionRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">conversion</p>
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: 'Likes', value: 12500, icon: <Heart className="h-5 w-5" />, color: 'text-red-500' },
                      { label: 'Comments', value: 3200, icon: <MessageSquare className="h-5 w-5" />, color: 'text-blue-500' },
                      { label: 'Bookmarks', value: 1800, icon: <Bookmark className="h-5 w-5" />, color: 'text-yellow-500' },
                      { label: 'Shares', value: 950, icon: <Share className="h-5 w-5" />, color: 'text-green-500' },
                    ].map((action) => (
                      <div key={action.label} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={action.color}>
                            {action.icon}
                          </div>
                          <span className="font-medium">{action.label}</span>
                        </div>
                        <span className="text-lg font-bold">{action.value.toLocaleString()}</span>
                      </div>
                    ))}
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
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={behaviorData?.engagementRate || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Interaction */}
            <Card>
              <CardHeader>
                <CardTitle>Content Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={behaviorData?.contentInteraction || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ec4899" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={behaviorData?.featureUsage || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(behaviorData?.featureUsage || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceBreakdown data={deviceData || []} isLoading={deviceLoading} />
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {geoLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="space-y-3">
                    {geoData?.slice(0, 8).map((country, index) => (
                      <div key={country.label} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{country.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${(country.value / (geoData[0]?.value || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-16 text-right">
                            {country.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Roles Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Roles Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userOverview?.roleDistribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(userOverview?.roleDistribution || []).map((_, index) => (
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

            {/* Registration Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="h-64 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userOverview?.registrationTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#06b6d420" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userSegments.map((segment) => (
                      <SelectItem key={segment.value} value={segment.value}>
                        {segment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity Score</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="reputation">Reputation</SelectItem>
                    <SelectItem value="contributions">Contributions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Top Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Users by {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopUsers users={topUsers || []} isLoading={topUsersLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}