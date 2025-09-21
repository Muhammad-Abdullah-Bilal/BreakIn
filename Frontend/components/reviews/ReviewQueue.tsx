'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService } from '@/lib/services/api';
import { Review, ReviewFilters } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Code,
  Star
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

interface ReviewQueueProps {
  className?: string;
}

export function ReviewQueue({ className }: ReviewQueueProps) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [selectedTab, setSelectedTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reviews', 'queue', user?.id, { ...filters, status: [selectedTab] }],
    queryFn: () => ReviewService.list({ ...filters, status: [selectedTab] }),
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Fetch mentor stats
  const {
    data: stats,
  } = useQuery({
    queryKey: ['reviews', 'stats', user?.id],
    queryFn: () => ReviewService.getMyReviews(),
    enabled: !!user,
    select: (reviews) => ({
      pending: reviews.filter(r => r.status === 'pending').length,
      inProgress: reviews.filter(r => r.status === 'in_progress').length,
      completed: reviews.filter(r => r.status === 'completed').length,
      total: reviews.length,
    }),
  });

  // Claim review mutation
  const claimMutation = useMutation({
    mutationFn: ReviewService.claim,
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(
        ['reviews', 'queue', user?.id, { ...filters, status: [selectedTab] }],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((review: Review) =>
              review.id === updatedReview.id ? updatedReview : review
            ),
          };
        }
      );
      
      // Refresh stats
      queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] });
    },
  });

  // Unclaim review mutation
  const unclaimMutation = useMutation({
    mutationFn: ReviewService.unclaim,
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(
        ['reviews', 'queue', user?.id, { ...filters, status: [selectedTab] }],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((review: Review) =>
              review.id === updatedReview.id ? updatedReview : review
            ),
          };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribe(`reviews.${user.id}`, (data: any) => {
      if (data.type === 'reviews.created' || data.type === 'reviews.updated' || data.type === 'reviews.completed') {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] });
      }
    });

    // Also subscribe to general reviews channel for new reviews
    const unsubscribeGeneral = subscribe('reviews.all', (data: any) => {
      if (data.type === 'reviews.created') {
        refetch();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeGeneral();
    };
  }, [user?.id, subscribe, refetch, queryClient]);

  const reviews = reviewsData?.data || [];

  const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClaim = (reviewId: string) => {
    claimMutation.mutate(reviewId);
  };

  const handleUnclaim = (reviewId: string) => {
    unclaimMutation.mutate(reviewId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Failed to load review queue</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">
            Manage and review submitted work from participants
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/mentor/calibration">
            <Star className="h-4 w-4 mr-2" />
            View Calibration
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stats?.pending || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({stats?.inProgress || 0})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats?.completed || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select 
              value={filters.type?.[0] || 'all'} 
              onValueChange={(value) => 
                handleFilterChange('type', value === 'all' ? undefined : [value])
              }
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="code_review">Code Review</SelectItem>
                <SelectItem value="design_review">Design Review</SelectItem>
                <SelectItem value="project_review">Project Review</SelectItem>
              </SelectContent>
            </Select>

            {filters.assignedToMe !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('assignedToMe', undefined)}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No reviews found</h3>
            <p className="text-muted-foreground">
              {selectedTab === 'pending' 
                ? 'No pending reviews at the moment' 
                : `No ${selectedTab.replace('_', ' ')} reviews found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onClaim={handleClaim}
              onUnclaim={handleUnclaim}
              isClaimLoading={claimMutation.isPending}
              isUnclaimLoading={unclaimMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onClaim: (reviewId: string) => void;
  onUnclaim: (reviewId: string) => void;
  isClaimLoading: boolean;
  isUnclaimLoading: boolean;
}

function ReviewCard({ 
  review, 
  onClaim, 
  onUnclaim, 
  isClaimLoading, 
  isUnclaimLoading 
}: ReviewCardProps) {
  const { user } = useAuth();
  const isMyReview = review.reviewerId === user?.id;
  const canClaim = review.status === 'pending' && !review.reviewerId;
  const canUnclaim = review.status === 'pending' && isMyReview;

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'in_progress':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: Review['type']) => {
    switch (type) {
      case 'code_review':
        return <Code className="h-4 w-4" />;
      case 'design_review':
        return <Eye className="h-4 w-4" />;
      case 'project_review':
        return <User className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              {getTypeIcon(review.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">
                    Review #{review.id.slice(-6)}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {review.type.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(review.status)}
                    <span className="text-sm text-muted-foreground">
                      {review.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Submission ID: {review.submissionId.slice(-8)}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
              </div>
              
              {review.claimedAt && (
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Claimed {formatDistanceToNow(new Date(review.claimedAt), { addSuffix: true })}</span>
                </div>
              )}

              {review.reviewerId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Reviewer: {review.reviewerName}</span>
                </div>
              )}

              {review.timeSpent && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{review.timeSpent} minutes spent</span>
                </div>
              )}
            </div>

            {/* Progress indicator for rubric */}
            {review.rubric.criteria.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Rubric Progress: </span>
                <span>
                  {review.rubric.criteria.filter(c => c.score !== undefined).length} / {review.rubric.criteria.length} criteria scored
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {canClaim && (
              <Button
                size="sm"
                onClick={() => onClaim(review.id)}
                disabled={isClaimLoading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Claim
              </Button>
            )}

            {canUnclaim && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnclaim(review.id)}
                disabled={isUnclaimLoading}
              >
                Unclaim
              </Button>
            )}

            <Button asChild size="sm" variant={isMyReview ? 'default' : 'outline'}>
              <Link href={`/mentor/review/${review.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                {isMyReview ? 'Continue' : 'View'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}