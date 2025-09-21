'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/lib/services/identity-api';
import { AdminSetting, FeatureFlag } from '@/lib/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings,
  Save,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Flag,
  Shield,
  Globe,
  Mail,
  Bell,
  Database,
  Key,
  Palette,
  Users,
  FileText,
  MessageSquare,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const settingFormSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['string', 'number', 'boolean', 'json']),
  isPublic: z.boolean().default(false),
});

const featureFlagFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  targetUsers: z.string().optional(),
  targetRoles: z.string().optional(),
});

type SettingFormData = z.infer<typeof settingFormSchema>;
type FeatureFlagFormData = z.infer<typeof featureFlagFormSchema>;

interface SettingFormProps {
  setting?: AdminSetting;
  onSuccess: () => void;
  onCancel: () => void;
}

const SettingForm: React.FC<SettingFormProps> = ({ setting, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingFormData>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: setting ? {
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
      category: setting.category,
      type: setting.type,
      isPublic: setting.isPublic,
    } : {
      type: 'string',
      isPublic: false,
    },
  });

  const watchedType = watch('type');

  const createMutation = useMutation({
    mutationFn: (data: SettingFormData) => adminService.createSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast({
        title: 'Setting created',
        description: 'The setting has been created successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating setting',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingFormData) => adminService.updateSetting(setting!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast({
        title: 'Setting updated',
        description: 'The setting has been updated successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating setting',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SettingFormData) => {
    if (setting) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const categories = [
    'general',
    'authentication',
    'notifications',
    'moderation',
    'content',
    'ui',
    'integrations',
    'security',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Key *</label>
          <Input
            {...register('key')}
            placeholder="setting_key"
            disabled={!!setting}
            className={errors.key ? 'border-destructive' : ''}
          />
          {errors.key && (
            <p className="text-sm text-destructive">{errors.key.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Select
            value={watch('category')}
            onValueChange={(value) => setValue('category', value)}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type *</label>
          <Select
            value={watch('type')}
            onValueChange={(value: any) => setValue('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Public Access */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Access</label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={watch('isPublic')}
              onCheckedChange={(checked) => setValue('isPublic', checked)}
            />
            <span className="text-sm">Public access</span>
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Value *</label>
        {watchedType === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <Switch
              checked={watch('value') === 'true'}
              onCheckedChange={(checked) => setValue('value', checked.toString())}
            />
            <span className="text-sm">{watch('value') === 'true' ? 'Enabled' : 'Disabled'}</span>
          </div>
        ) : watchedType === 'json' ? (
          <Textarea
            {...register('value')}
            placeholder='{"key": "value"}'
            rows={4}
            className={errors.value ? 'border-destructive' : ''}
          />
        ) : (
          <Input
            {...register('value')}
            type={watchedType === 'number' ? 'number' : 'text'}
            placeholder="Setting value"
            className={errors.value ? 'border-destructive' : ''}
          />
        )}
        {errors.value && (
          <p className="text-sm text-destructive">{errors.value.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          {...register('description')}
          placeholder="Brief description of this setting"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : setting ? 'Update Setting' : 'Create Setting'}
        </Button>
      </DialogFooter>
    </form>
  );
};

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
    } : {
      enabled: false,
      rolloutPercentage: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FeatureFlagFormData) => adminService.createFeatureFlag({
      ...data,
      targetUsers: data.targetUsers ? data.targetUsers.split(',').map(s => s.trim()).filter(Boolean) : [],
      targetRoles: data.targetRoles ? data.targetRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
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
      {/* Name */}
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
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          {...register('description')}
          placeholder="Description of this feature flag"
          rows={2}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Enabled */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={watch('enabled')}
              onCheckedChange={(checked) => setValue('enabled', checked)}
            />
            <span className="text-sm">{watch('enabled') ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Rollout Percentage */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rollout Percentage</label>
          <Input
            {...register('rolloutPercentage', { valueAsNumber: true })}
            type="number"
            min="0"
            max="100"
            placeholder="0"
          />
        </div>
      </div>

      {/* Target Users */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Users</label>
        <Input
          {...register('targetUsers')}
          placeholder="user1@example.com, user2@example.com"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of user emails (optional)
        </p>
      </div>

      {/* Target Roles */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Roles</label>
        <Input
          {...register('targetRoles')}
          placeholder="admin, mentor, premium"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of user roles (optional)
        </p>
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

export function GlobalSettings() {
  const [editingSetting, setEditingSetting] = useState<AdminSetting | null>(null);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [showSettingDialog, setShowSettingDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin settings
  const { 
    data: settings, 
    isLoading: settingsLoading, 
    isError: settingsError,
    refetch: refetchSettings 
  } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminService.getSettings(),
  });

  // Fetch feature flags
  const { 
    data: featureFlags, 
    isLoading: flagsLoading,
    isError: flagsError,
    refetch: refetchFlags 
  } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: () => adminService.getFeatureFlags(),
  });

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: (settingId: string) => adminService.deleteSetting(settingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast({
        title: 'Setting deleted',
        description: 'The setting has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting setting',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
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

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchSettings(), refetchFlags()]);
      toast({
        title: 'Settings refreshed',
        description: 'All settings have been refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh settings.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general':
        return <Settings className="h-4 w-4" />;
      case 'authentication':
        return <Key className="h-4 w-4" />;
      case 'notifications':
        return <Bell className="h-4 w-4" />;
      case 'moderation':
        return <Shield className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'ui':
        return <Palette className="h-4 w-4" />;
      case 'integrations':
        return <Globe className="h-4 w-4" />;
      case 'security':
        return <Lock className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const filteredSettings = settings?.filter(setting => 
    selectedCategory === 'all' || setting.category === selectedCategory
  ) || [];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'moderation', label: 'Moderation' },
    { value: 'content', label: 'Content' },
    { value: 'ui', label: 'User Interface' },
    { value: 'integrations', label: 'Integrations' },
    { value: 'security', label: 'Security' },
  ];

  if (settingsError || flagsError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Settings</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the settings.
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
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground">
            Manage application settings and feature flags
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showSettingDialog} onOpenChange={setShowSettingDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Setting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Setting</DialogTitle>
                  <DialogDescription>
                    Add a new application setting.
                  </DialogDescription>
                </DialogHeader>
                <SettingForm
                  onSuccess={() => setShowSettingDialog(false)}
                  onCancel={() => setShowSettingDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Settings List */}
          {settingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="h-6 w-6 bg-muted rounded" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSettings.map((setting) => (
                <Card key={setting.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getCategoryIcon(setting.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{setting.key}</h3>
                            <Badge variant="outline">{setting.category}</Badge>
                            <Badge variant={setting.isPublic ? "default" : "secondary"}>
                              {setting.isPublic ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                              {setting.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          {setting.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {setting.description}
                            </p>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Value:</span>
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {setting.type === 'boolean' 
                                  ? (setting.value === 'true' ? 'Enabled' : 'Disabled')
                                  : setting.value
                                }
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {setting.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Updated {formatDistanceToNow(new Date(setting.updatedAt), { addSuffix: true })}
                              {setting.updatedBy && ` by ${setting.updatedBy}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSetting(setting);
                            setShowSettingDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSettingMutation.mutate(setting.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Flags Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Feature Flags</h2>
              <p className="text-sm text-muted-foreground">
                Control feature rollouts and A/B testing
              </p>
            </div>
            
            <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature Flag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                  <DialogDescription>
                    Create a new feature flag for gradual rollouts.
                  </DialogDescription>
                </DialogHeader>
                <FeatureFlagForm
                  onSuccess={() => setShowFlagDialog(false)}
                  onCancel={() => setShowFlagDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Feature Flags List */}
          {flagsLoading ? (
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
              {featureFlags?.map((flag) => (
                <Card key={flag.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{flag.name}</h3>
                          <Badge variant={flag.enabled ? "default" : "secondary"}>
                            {flag.enabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {flag.rolloutPercentage > 0 && (
                            <Badge variant="outline">
                              {flag.rolloutPercentage}% rollout
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {flag.description}
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {flag.targetUsers && flag.targetUsers.length > 0 && (
                            <p>Target users: {flag.targetUsers.join(', ')}</p>
                          )}
                          {flag.targetRoles && flag.targetRoles.length > 0 && (
                            <p>Target roles: {flag.targetRoles.join(', ')}</p>
                          )}
                          <p>
                            Updated {formatDistanceToNow(new Date(flag.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || []}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Setting Dialog */}
      <Dialog 
        open={showSettingDialog && !!editingSetting} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingSetting(null);
            setShowSettingDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting configuration.
            </DialogDescription>
          </DialogHeader>
          {editingSetting && (
            <SettingForm
              setting={editingSetting}
              onSuccess={() => {
                setEditingSetting(null);
                setShowSettingDialog(false);
              }}
              onCancel={() => {
                setEditingSetting(null);
                setShowSettingDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the feature flag configuration.
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