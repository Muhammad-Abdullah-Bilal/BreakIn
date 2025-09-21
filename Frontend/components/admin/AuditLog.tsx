'use client';

import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/services/identity-api';
import { AuditLog } from '@/lib/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { 
  Search,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  Shield,
  User,
  Settings,
  FileText,
  MessageSquare,
  Flag,
  Key,
  Database,
  Globe,
  Bell,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Info,
  Filter,
  ExternalLink
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { useInView } from 'react-intersection-observer';

interface AuditLogFilters {
  search: string;
  action: string;
  resource: string;
  userId: string;
  severity: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface AuditLogDetailProps {
  log: AuditLog;
}

const AuditLogDetail: React.FC<AuditLogDetailProps> = ({ log }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{log.action}</h3>
          <p className="text-sm text-muted-foreground">
            {log.resource} • {format(new Date(log.timestamp), 'PPpp')}
          </p>
        </div>
        <Badge variant={getSeverityVariant(log.severity)}>
          {log.severity.toUpperCase()}
        </Badge>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">User Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono">{log.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Address:</span>
              <span className="font-mono">{log.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User Agent:</span>
              <span className="font-mono text-xs truncate" title={log.userAgent}>
                {log.userAgent}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Request Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resource:</span>
              <span>{log.resource}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resource ID:</span>
              <span className="font-mono">{log.resourceId || 'N/A'}</span>
            </div>
            {log.sessionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-xs">{log.sessionId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Changes */}
      {log.changes && Object.keys(log.changes).length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Changes Made</h4>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(log.changes, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Additional Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Additional Metadata</h4>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Description */}
      {log.description && (
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">
            {log.description}
          </p>
        </div>
      )}
    </div>
  );
};

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case 'high':
    case 'critical':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getActionIcon(action: string) {
  switch (action.toLowerCase()) {
    case 'create':
    case 'register':
    case 'signup':
      return <Plus className="h-4 w-4" />;
    case 'update':
    case 'edit':
    case 'modify':
      return <Edit className="h-4 w-4" />;
    case 'delete':
    case 'remove':
      return <Trash2 className="h-4 w-4" />;
    case 'login':
    case 'authenticate':
      return <Key className="h-4 w-4" />;
    case 'logout':
      return <ExternalLink className="h-4 w-4" />;
    case 'approve':
    case 'accept':
      return <CheckCircle className="h-4 w-4" />;
    case 'reject':
    case 'deny':
      return <XCircle className="h-4 w-4" />;
    case 'moderate':
    case 'flag':
      return <Flag className="h-4 w-4" />;
    case 'admin':
    case 'configure':
      return <Settings className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getResourceIcon(resource: string) {
  switch (resource.toLowerCase()) {
    case 'user':
    case 'profile':
      return <User className="h-4 w-4" />;
    case 'post':
    case 'content':
    case 'article':
      return <FileText className="h-4 w-4" />;
    case 'comment':
    case 'discussion':
      return <MessageSquare className="h-4 w-4" />;
    case 'settings':
    case 'configuration':
      return <Settings className="h-4 w-4" />;
    case 'moderation':
      return <Shield className="h-4 w-4" />;
    case 'authentication':
    case 'session':
      return <Key className="h-4 w-4" />;
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'api':
    case 'integration':
      return <Globe className="h-4 w-4" />;
    case 'notification':
      return <Bell className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

export function AuditLog() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    action: 'all',
    resource: 'all',
    userId: '',
    severity: 'all',
    startDate: null,
    endDate: null,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);
  const { ref, inView } = useInView();

  // Fetch audit logs with pagination and filtering
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['auditLogs', debouncedSearch, filters],
    queryFn: ({ pageParam = 0 }) => 
      adminService.getAuditLogs({
        page: pageParam,
        limit: 20,
        search: debouncedSearch || undefined,
        action: filters.action !== 'all' ? filters.action : undefined,
        resource: filters.resource !== 'all' ? filters.resource : undefined,
        userId: filters.userId || undefined,
        severity: filters.severity !== 'all' ? filters.severity : undefined,
        startDate: filters.startDate ? startOfDay(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? endOfDay(filters.endDate).toISOString() : undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Load more when scrolling to bottom
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allLogs = data?.pages.flatMap(page => page.logs) || [];

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeSelect = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        setFilters(prev => ({
          ...prev,
          startDate: startOfDay(now),
          endDate: endOfDay(now),
        }));
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setFilters(prev => ({
          ...prev,
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
        }));
        break;
      case 'last7days':
        setFilters(prev => ({
          ...prev,
          startDate: subDays(now, 7),
          endDate: now,
        }));
        break;
      case 'last30days':
        setFilters(prev => ({
          ...prev,
          startDate: subDays(now, 30),
          endDate: now,
        }));
        break;
      case 'custom':
        // Keep current dates for custom selection
        break;
      default:
        setFilters(prev => ({
          ...prev,
          startDate: null,
          endDate: null,
        }));
    }
  };

  const handleExport = async () => {
    try {
      // This would trigger a download of audit logs in CSV/JSON format
      const exportData = await adminService.exportAuditLogs(filters);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Audit Logs</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the audit logs.
          </p>
          <Button onClick={() => refetch()}>
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
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs by action, resource, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Action Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Resource</label>
                <Select
                  value={filters.resource}
                  onValueChange={(value) => handleFilterChange('resource', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={filters.severity}
                  onValueChange={(value) => handleFilterChange('severity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User ID Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Filter by user ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date Range:</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangeSelect('today')}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangeSelect('yesterday')}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangeSelect('last7days')}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangeSelect('last30days')}
                >
                  Last 30 days
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {filters.startDate ? format(filters.startDate, 'MMM d') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleFilterChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {filters.endDate ? format(filters.endDate, 'MMM d') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleFilterChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {(filters.startDate || filters.endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateRangeSelect('clear')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-muted rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {allLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Action Icon */}
                    <div className="p-2 bg-muted rounded-lg">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{log.action}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getResourceIcon(log.resource)}
                          <span>{log.resource}</span>
                        </div>
                        <Badge variant={getSeverityVariant(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {log.description && (
                          <p className="text-sm text-muted-foreground">
                            {log.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>User: {log.userId}</span>
                          <span>IP: {log.ipAddress}</span>
                          <span>{format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                          Detailed information about this audit log entry.
                        </DialogDescription>
                      </DialogHeader>
                      <AuditLogDetail log={log} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={ref} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more logs...
                </div>
              ) : (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              )}
            </div>
          )}
          
          {/* No Results */}
          {allLogs.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
                <p className="text-muted-foreground">
                  No audit logs match your current filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}