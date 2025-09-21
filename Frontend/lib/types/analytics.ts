// Analytics and Dashboard Types
// Frozen contracts - PR required to change

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'percentage' | 'currency' | 'duration';
  description: string;
  category: 'users' | 'engagement' | 'growth' | 'performance' | 'revenue';
  timeframe: 'realtime' | '24h' | '7d' | '30d' | '90d' | '1y';
  updatedAt: string;
}

export interface CohortMetric {
  id: string;
  name: string;
  cohortDate: string; // YYYY-MM-DD
  totalUsers: number;
  activeUsers: number;
  retentionRate: number;
  conversionRate?: number;
  averageEngagement: number;
  milestones: CohortMilestone[];
  createdAt: string;
}

export interface CohortMilestone {
  name: string;
  description: string;
  completedUsers: number;
  completionRate: number;
  averageTimeToComplete?: number; // days
}

export interface TimeSeriesData {
  date: string; // YYYY-MM-DD
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

// Dashboard Widgets
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric';
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large';
  data: KPI | ChartData | TableData | any;
  refreshInterval?: number; // seconds
  lastUpdated: string;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  sortable?: boolean;
  searchable?: boolean;
}

// Analytics Filters
export interface AnalyticsFilters {
  timeframe: '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  userRole?: 'junior' | 'mentor' | 'recruiter' | 'all';
  cohort?: string;
  segment?: string;
}

export interface CohortFilters {
  startDate?: string;
  endDate?: string;
  userRole?: 'junior' | 'mentor' | 'recruiter' | 'all';
  minCohortSize?: number;
  sortBy?: 'date' | 'size' | 'retention' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

// Chart Configuration
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled: boolean;
      mode?: 'index' | 'point';
    };
  };
  scales?: {
    x?: {
      display: boolean;
      grid?: { display: boolean };
    };
    y?: {
      display: boolean;
      grid?: { display: boolean };
      beginAtZero?: boolean;
    };
  };
}

// Analytics API Responses
export interface KPIResponse {
  kpis: KPI[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    growthRate: number;
    engagementScore: number;
  };
  lastUpdated: string;
}

export interface CohortResponse {
  cohorts: CohortMetric[];
  aggregates: {
    averageRetention: number;
    averageEngagement: number;
    totalCohorts: number;
    activeCohorts: number;
  };
  trends: TimeSeriesData[];
}

// User Engagement Metrics
export interface UserEngagement {
  userId: string;
  sessionsCount: number;
  totalTimeSpent: number; // minutes
  actionsCount: number;
  lastActiveAt: string;
  engagementScore: number; // 0-100
  activities: UserActivity[];
}

export interface UserActivity {
  type: 'login' | 'view' | 'create' | 'comment' | 'like' | 'share' | 'complete';
  resource: 'article' | 'thread' | 'post' | 'sprint' | 'submission';
  resourceId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Performance Metrics
export interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
  unit: 'ms' | 'seconds' | 'percentage' | 'count';
}

// Analytics Events
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

// Real-time Analytics
export interface RealtimeMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  sparkline?: number[];
  updatedAt: string;
}