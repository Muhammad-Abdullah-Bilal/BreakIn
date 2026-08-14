'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/lib/services/identity-api';
import { FeatureFlag } from '@/lib/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Flag,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  RefreshCw,
  Search,
  Filter,
  Users,
  Target,
  Percent,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  BarChart3,
  Clock,
  Globe,
  Lock,
  Unlock,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const featureFlagFormSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-z0-9_]+$/, 'Name must be lowercase with underscores only'),
  description: z.string().min(1, 'Description is required'),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  targetUsers: z.string().optional(),
  targetRoles: z.string().optional(),
  conditions: z.string().optional(),
  environment: z.string().default('production'),
});

type FeatureFlagFormData = z.infer<typeof featureFlagFormSchema>;

interface FeatureFlagFormProps {
  flag?: FeatureFlag;
  onSuccess: () => void;
  onCancel: () => void;
}

const FeatureFlagForm: React.FC<FeatureFlagFormProps> = ({ flag, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FeatureFlagFormData>({
    resolver: zodResolver(featureFlagFormSchema),
    defaultValues: flag ? {
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      targetUsers: flag.targetUsers?.join(', ') || '',
      targetRoles: flag.targetRoles?.join(', ') || '',
      conditions: JSON.stringify(flag.conditions || {}, null, 2),
      environment: flag.environment || 'production',
    } : {
      enabled: false,
      rolloutPercentage: 0,
      environment: 'production',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FeatureFlagFormData) => adminService.createFeatureFlag({
      ...data,
      targetUsers: data.targetUsers ? data.targetUsers.split(',').map(s => s.trim()).filter(Boolean) : [],
      targetRoles: data.targetRoles ? data.targetRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
      conditions: data.conditions ? JSON.parse(data.conditions) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast({
        title: 'Feature flag created',
        description: 'The feature flag has been created successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating feature flag',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FeatureFlagFormData) => adminService.updateFeatureFlag(flag!.id, {
      ...data,
      targetUsers: data.targetUsers ? data.targetUsers.split(',').map(s => s.trim()).filter(Boolean) : [],
      targetRoles: data.targetRoles ? data.targetRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
      conditions: data.conditions ? JSON.parse(data.conditions) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast({
        title: 'Feature flag updated',
        description: 'The feature flag has been updated successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating feature flag',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FeatureFlagFormData) => {
    if (flag) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <Input
            {...register('name')}
            placeholder="new_feature_flag"
            disabled={!!flag}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and underscores only
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Environment</label>
          <Select
            value={watch('environment')}
            onValueChange={(value) => setValue('environment', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          {...register('description')}
          placeholder="Describe what this feature flag controls"
          rows={2}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Status and Rollout */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('enabled')}
                onCheckedChange={(checked) => setValue('enabled', checked)}
              />
              <span className="text-sm">
                {watch('enabled') ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Rollout Percentage: {watch('rolloutPercentage')}%
          </label>
          <Slider
            value={[watch('rolloutPercentage')]}
            onValueChange={(value) => setValue('rolloutPercentage', value[0])}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div className="space-y-4">
        <h4 className="font-medium">Targeting Options</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Users</label>
            <Input
              {...register('targetUsers')}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of user emails
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Roles</label>
            <Input
              {...register('targetRoles')}
              placeholder="admin, premium, beta"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of user roles
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Advanced Conditions (JSON)</label>
          <Textarea
            {...register('conditions')}
            placeholder='{"userAgent": {"contains": "Chrome"}, "location": {"country": "US"}}'
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            JSON object defining additional targeting conditions
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : flag ? 'Update Flag' : 'Create Flag'}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface FeatureFlagStatsProps {
  flag: FeatureFlag;
}

const FeatureFlagStats: React.FC<FeatureFlagStatsProps> = ({ flag }) => {
  const { data: stats } = useQuery({
    queryKey: ['featureFlagStats', flag.id],
    queryFn: () => adminService.getFeatureFlagStats(flag.id),
  });

  if (!stats) {
    return (
      <div className="text-center p-8">
        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.totalExposures}</div>
          <div className="text-sm text-muted-foreground">Total Exposures</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          <div className="text-sm text-muted-foreground">Unique Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.enabledPercentage}%</div>
          <div className="text-sm text-muted-foreground">Enabled Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.errorRate}%</div>
          <div className="text-sm text-muted-foreground">Error Rate</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="font-medium mb-3">Recent Activity</h4>
        <div className="space-y-2">
          {stats.recentActivity?.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm">{activity.action}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
};

export function FeatureFlagsManager() {
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch feature flags
  const { 
    data: featureFlags, 
    isLoading,
    isError,
    refetch 
  } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: () => adminService.getFeatureFlags(),
  });

  // Toggle feature flag mutation
  const toggleFlagMutation = useMutation({
    mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) => 
      adminService.toggleFeatureFlag(flagId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast({
        title: 'Feature flag updated',
        description: 'The feature flag has been toggled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating feature flag',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  // Delete feature flag mutation
  const deleteFlagMutation = useMutation({
    mutationFn: (flagId: string) => adminService.deleteFeatureFlag(flagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast({
        title: 'Feature flag deleted',
        description: 'The feature flag has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting feature flag',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  // Copy flag code snippet
  const copyCodeSnippet = (flagName: string) => {
    const codeSnippet = `// Check if feature flag is enabled
const isFeatureEnabled = useFeatureFlag('${flagName}');

if (isFeatureEnabled) {
  // Feature code here
}`;
    
    navigator.clipboard.writeText(codeSnippet);
    toast({
      title: 'Code snippet copied',
      description: 'The code snippet has been copied to your clipboard.',
    });
  };

  const filteredFlags = featureFlags?.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && flag.enabled) ||
                         (statusFilter === 'disabled' && !flag.enabled);
    const matchesEnvironment = environmentFilter === 'all' || flag.environment === environmentFilter;
    
    return matchesSearch && matchesStatus && matchesEnvironment;
  }) || [];

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Feature Flags</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the feature flags.
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
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">
            Manage feature rollouts and A/B testing
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Create a new feature flag for gradual rollouts and A/B testing.
                </DialogDescription>
              </DialogHeader>
              <FeatureFlagForm
                onSuccess={() => setShowFlagDialog(false)}
                onCancel={() => setShowFlagDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feature flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>

            {/* Environment Filter */}
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlags.map((flag) => (
            <Card key={flag.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{flag.name}</h3>
                      <Badge variant={flag.enabled ? "default" : "secondary"}>
                        {flag.enabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline">
                        {flag.environment}
                      </Badge>
                      {flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100 && (
                        <Badge variant="outline">
                          <Percent className="h-3 w-3 mr-1" />
                          {flag.rolloutPercentage}% rollout
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {flag.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {flag.targetUsers && flag.targetUsers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{flag.targetUsers.length} target users</span>
                        </div>
                      )}
                      {flag.targetRoles && flag.targetRoles.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{flag.targetRoles.join(', ')}</span>
                        </div>
                      )}
                      <span>
                        Updated {formatDistanceToNow(new Date(flag.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quick Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCodeSnippet(flag.name)}
                      title="Copy code snippet"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFlag(flag)}
                          title="View statistics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{flag.name} Statistics</DialogTitle>
                          <DialogDescription>
                            Usage statistics and performance metrics for this feature flag.
                          </DialogDescription>
                        </DialogHeader>
                        <FeatureFlagStats flag={flag} />
                      </DialogContent>
                    </Dialog>
                    
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(enabled) => 
                        toggleFlagMutation.mutate({ flagId: flag.id, enabled })
                      }
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFlag(flag);
                        setShowFlagDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the feature flag "{flag.name}"? 
                            This action cannot be undone and may affect your application.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFlagMutation.mutate(flag.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* No Results */}
          {filteredFlags.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Feature Flags Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' || environmentFilter !== 'all'
                    ? 'No feature flags match your current filters.'
                    : 'Get started by creating your first feature flag.'
                  }
                </p>
                {(!searchQuery && statusFilter === 'all' && environmentFilter === 'all') && (
                  <Button onClick={() => setShowFlagDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Feature Flag
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Feature Flag Dialog */}
      <Dialog 
        open={showFlagDialog && !!editingFlag} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingFlag(null);
            setShowFlagDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the feature flag configuration and targeting rules.
            </DialogDescription>
          </DialogHeader>
          {editingFlag && (
            <FeatureFlagForm
              flag={editingFlag}
              onSuccess={() => {
                setEditingFlag(null);
                setShowFlagDialog(false);
              }}
              onCancel={() => {
                setEditingFlag(null);
                setShowFlagDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}