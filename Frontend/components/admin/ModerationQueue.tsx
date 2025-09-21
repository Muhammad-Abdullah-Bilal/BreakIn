'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '@/lib/services/identity-api';
import { ModerationQueueItem, ModerationAction, ModerationFilters } from '@/lib/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Flag,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Timer,
  Ban,
  Unlock,
  Edit,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';

const moderationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'remove', 'ban_user', 'warn_user']),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

type ModerationActionData = z.infer<typeof moderationActionSchema>;

interface ModerationActionDialogProps {
  item: ModerationQueueItem;
  onSuccess: () => void;
  onCancel: () => void;
}

const ModerationActionDialog: React.FC<ModerationActionDialogProps> = ({ 
  item, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ModerationActionData>({
    resolver: zodResolver(moderationActionSchema),
    defaultValues: {
      action: 'approve',
    },
  });

  const watchedAction = watch('action');

  const takeModerationAction = useMutation({
    mutationFn: (data: ModerationActionData) => 
      moderationService.takeModerationAction(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast({
        title: 'Action completed',
        description: 'Moderation action has been applied successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Action failed',
        description: error.message || 'Failed to complete moderation action.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ModerationActionData) => {
    takeModerationAction.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Action Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Action *</label>
        <select
          {...register('action')}
          className="w-full p-3 border rounded-md bg-background"
        >
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="remove">Remove Content</option>
          <option value="warn_user">Warn User</option>
          <option value="ban_user">Ban User</option>
        </select>
      </div>

      {/* Duration (for bans) */}
      {watchedAction === 'ban_user' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Ban Duration</label>
          <select
            {...register('duration')}
            className="w-full p-3 border rounded-md bg-background"
          >
            <option value="">Permanent</option>
            <option value="1d">1 Day</option>
            <option value="3d">3 Days</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Reason *</label>
        <Textarea
          {...register('reason')}
          placeholder="Explain the reason for this action"
          rows={3}
          className={errors.reason ? 'border-destructive' : ''}
        />
        {errors.reason && (
          <p className="text-sm text-destructive">{errors.reason.message}</p>
        )}
      </div>

      {/* Internal Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Internal Notes</label>
        <Textarea
          {...register('notes')}
          placeholder="Internal notes for other moderators (optional)"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Apply Action'}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface ModerationItemCardProps {
  item: ModerationQueueItem;
  onAction: (item: ModerationQueueItem) => void;
}

const ModerationItemCard: React.FC<ModerationItemCardProps> = ({ item, onAction }) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'escalated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getPriorityColor(item.priority)} bg-muted/50`}>
                {getTypeIcon(item.contentType)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(item.priority)}>
                    {item.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    {item.contentType}
                  </Badge>
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Reported {formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction(item)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Moderate
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={item.contentUrl} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Content
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Escalate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reporter Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={item.reporter.avatarUrl} />
              <AvatarFallback className="text-xs">
                {item.reporter.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Reported by {item.reporter.displayName}</p>
              <p className="text-xs text-muted-foreground">
                Reason: {item.reportReason}
              </p>
            </div>
          </div>

          {/* Content Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Content Preview</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="p-3 border rounded-lg bg-background">
              <p className="text-sm">
                {showFullContent ? item.content : truncateContent(item.content)}
              </p>
            </div>
          </div>

          {/* Content Author */}
          {item.contentAuthor && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.contentAuthor.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {item.contentAuthor.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Author: {item.contentAuthor.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.contentAuthor.role} • Member since {format(new Date(item.contentAuthor.joinedAt), 'MMM yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Previous Actions */}
          {item.previousActions && item.previousActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Previous Actions</h4>
              <div className="space-y-2">
                {item.previousActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded">
                    <span>{action.action} by {action.moderator}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onAction(item)}
              className="flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Moderate
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={item.contentUrl} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ModerationQueue() {
  const [filters, setFilters] = useState<ModerationFilters>({
    status: 'pending',
    contentType: '',
    priority: '',
    dateRange: '7d',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch moderation queue
  const { 
    data: queueData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['moderationQueue', filters, debouncedSearch],
    queryFn: () => moderationService.getModerationQueue({
      ...filters,
      search: debouncedSearch,
    }),
  });

  // Fetch moderation stats
  const { data: statsData } = useQuery({
    queryKey: ['moderationStats'],
    queryFn: () => moderationService.getModerationStats(),
  });

  const handleAction = (item: ModerationQueueItem) => {
    setSelectedItem(item);
    setShowActionDialog(true);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: 'Queue refreshed',
        description: 'Moderation queue has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh moderation queue.',
        variant: 'destructive',
      });
    }
  };

  const updateFilter = (key: keyof ModerationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      contentType: '',
      priority: '',
      dateRange: '7d',
    });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== '7d') || searchQuery !== '';

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Moderation Queue</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the moderation queue.
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
          <h1 className="text-3xl font-bold">Moderation Queue</h1>
          <p className="text-muted-foreground">
            Review and moderate reported content and users
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{statsData.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{statsData.resolvedToday}</p>
                  <p className="text-sm text-muted-foreground">Resolved Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Timer className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{statsData.avgResponseTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{statsData.escalatedCount}</p>
                  <p className="text-sm text-muted-foreground">Escalated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by content, user, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.contentType} onValueChange={(value) => updateFilter('contentType', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-5 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : queueData && queueData.items.length > 0 ? (
        <div className="space-y-4">
          {queueData.items.map((item) => (
            <ModerationItemCard
              key={item.id}
              item={item}
              onAction={handleAction}
            />
          ))}
          
          {queueData.hasMore && (
            <div className="text-center">
              <Button variant="outline">
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Items in Queue</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'No items match your current filters.'
                : 'All caught up! No items need moderation.'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>Clear Filters</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Moderation Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderate Content</DialogTitle>
            <DialogDescription>
              Take action on this reported content or user.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <ModerationActionDialog
              item={selectedItem}
              onSuccess={() => setShowActionDialog(false)}
              onCancel={() => setShowActionDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}