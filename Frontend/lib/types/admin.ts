// Admin and Moderation Types
// Frozen contracts - PR required to change

export interface AdminSetting {
  id: string;
  key: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'json';
  category: 'security' | 'features' | 'limits' | 'notifications' | 'content';
  name: string;
  description: string;
  defaultValue: any;
  sensitive: boolean;
  isPublic?: boolean;
  updatedById?: string;
  updatedByName?: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  sessionId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  description?: string;
}

export interface UserBan {
  id: string;
  userId: string;
  userName: string;
  bannedById: string;
  bannedByName: string;
  reason: string;
  type: 'temporary' | 'permanent';
  duration?: number; // hours for temporary bans
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string;
  revokedById?: string;
  revokedByName?: string;
}

// Moderation Queue
export interface ModerationQueueItem extends ModerationFlag {
  id: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  targetContent?: string;
  targetAuthorId?: string;
  targetAuthorName?: string;
  targetUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId?: string;
  assignedToName?: string;
  estimatedReviewTime?: number; // minutes
  contentType?: string;
  title?: string;
  content?: string;
  contentAuthor?: string;
  contentUrl?: string;
  reporter?: string;
  reportedAt?: string;
  reportReason?: string;
}

export interface ModerationAction {
  flagId: string;
  action: 'approve' | 'remove' | 'warn' | 'ban';
  reason?: string;
  banDuration?: number; // hours
  note?: string;
}

// Admin Dashboard
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    banned: number;
  };
  content: {
    posts: number;
    threads: number;
    articles: number;
    flagged: number;
  };
  moderation: {
    pendingFlags: number;
    resolvedToday: number;
    activeBans: number;
    avgResolutionTime: number; // minutes
  };
  system: {
    uptime: number; // percentage
    responseTime: number; // ms
    errorRate: number; // percentage
    activeUsers: number;
  };
}

// Feature Flags
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers?: string[];
  targetRoles?: string[];
  conditions?: FeatureFlagCondition[];
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: any;
}

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  metrics: PerformanceMetric[];
  alerts: SystemAlert[];
  lastChecked: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  uptime: number; // percentage
  lastError?: string;
  lastErrorAt?: string;
}

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  service?: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  createdAt: string;
  resolvedAt?: string;
}

// Content Moderation
export interface ContentModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'keyword' | 'pattern' | 'length' | 'link' | 'image';
  pattern?: string;
  keywords?: string[];
  action: 'flag' | 'block' | 'warn';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  appliesTo: ('post' | 'thread' | 'reply' | 'message')[];
  createdAt: string;
  updatedAt: string;
}

// User Management
export interface UserManagement {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  emailVerified: boolean;
  onboardingCompleted: boolean;
  lastLoginAt?: string;
  createdAt: string;
  stats: {
    postsCount: number;
    threadsCount: number;
    repliesCount: number;
    reputationPoints: number;
    flagsReceived: number;
  };
}

// Admin Filters
export interface AdminFilters {
  search?: string;
  role?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ModerationFilters {
  status?: ModerationFlag['status'][];
  reason?: ModerationFlag['reason'][];
  type?: ModerationFlag['targetType'][];
  priority?: ModerationQueueItem['priority'][];
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'created' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Bulk Actions
export interface BulkAction {
  action: 'approve' | 'reject' | 'ban' | 'delete' | 'assign';
  itemIds: string[];
  reason?: string;
  assignTo?: string;
  banDuration?: number;
}

// Admin Notifications
export interface AdminNotification {
  id: string;
  type: 'system' | 'moderation' | 'security' | 'user';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}