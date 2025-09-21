'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SprintService } from '@/lib/services/api';
import { Sprint, SprintFilters } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Plus, Search, Filter, Clock, Users, Target, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SprintDashboardProps {
  className?: string;
}

export function SprintDashboard({ className }: SprintDashboardProps) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [filters, setFilters] = useState<SprintFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch user's sprints
  const {
    data: sprintsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sprints', 'dashboard', user?.id, filters],
    queryFn: () => SprintService.list(filters),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Subscribe to sprint updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribe('sprints', (data: any) => {
      if (data.type === 'sprints.updated') {
        refetch();
      }
    });

    return unsubscribe;
  }, [user?.id, subscribe, refetch]);

  const sprints = sprintsData?.data || [];
  const activeSprints = sprints.filter(sprint => sprint.status === 'active');
  const draftSprints = sprints.filter(sprint => sprint.status === 'draft');

  // Quick stats
  const stats = {
    active: activeSprints.length,
    completed: sprints.filter(s => s.status === 'completed').length,
    totalTasks: activeSprints.reduce((sum, sprint) => sum + sprint.tasks.length, 0),
    completedTasks: activeSprints.reduce((sum, sprint) => 
      sum + sprint.tasks.filter(task => task.status === 'completed').length, 0
    ),
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const handleFilterChange = (key: keyof SprintFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Failed to load sprints</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your active sprints and track progress
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
            </DialogHeader>
            <CreateSprintForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              refetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sprints</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Progress</p>
                <p className="text-2xl font-bold">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sprints..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status?.[0] || 'all'} onValueChange={(value) => 
              handleFilterChange('status', value === 'all' ? undefined : [value])
            }>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.difficulty?.[0] || 'all'} onValueChange={(value) => 
              handleFilterChange('difficulty', value === 'all' ? undefined : [value])
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Grid */}
      {sprints.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No sprints found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first sprint to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SprintCardProps {
  sprint: Sprint;
}

function SprintCard({ sprint }: SprintCardProps) {
  const getStatusColor = (status: Sprint['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: Sprint['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{sprint.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {sprint.description}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(sprint.status)}`} />
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={getDifficultyColor(sprint.difficulty)}>
            {sprint.difficulty}
          </Badge>
          <Badge variant="secondary">
            {sprint.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{sprint.progress.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${sprint.progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDistanceToNow(new Date(sprint.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{sprint.currentParticipants} members</span>
            </div>
          </div>

          {/* Tasks summary */}
          <div className="text-sm text-muted-foreground">
            {sprint.progress.completedTasks}/{sprint.progress.totalTasks} tasks completed
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/sprint/${sprint.id}`}>
                View Details
              </Link>
            </Button>
            {sprint.status === 'active' && (
              <Button asChild size="sm" className="flex-1">
                <Link href={`/sprint/${sprint.id}/tasks`}>
                  Continue
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Sprint Form Component (placeholder for now)
function CreateSprintForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Create sprint form will be implemented here</p>
      <Button onClick={onSuccess} className="mt-4">
        Create Sprint (Mock)
      </Button>
    </div>
  );
}