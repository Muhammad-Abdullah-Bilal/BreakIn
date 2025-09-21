'use client';

import React, { useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService, forumService } from '@/lib/services/identity-api';
import { Post, PostFilters, CreatePostRequest } from '@/lib/types/community';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Filter,
  Plus,
  RefreshCw,
  ChevronDown,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { useInView } from 'react-intersection-observer';

interface WorldFeedProps {
  className?: string;
}

export function WorldFeed({ className }: WorldFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'latest' | 'trending' | 'following'>('latest');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ref: loadMoreRef, inView } = useInView();

  // Build filters
  const filters: PostFilters = {
    sortBy: activeFilter === 'latest' ? 'createdAt' : 
            activeFilter === 'trending' ? 'engagement' : 'relevance',
    sortOrder: 'desc',
    tags: selectedTag ? [selectedTag] : undefined,
    followingOnly: activeFilter === 'following',
  };

  // Fetch posts with infinite scroll
  const {
    data: postsData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['worldFeed', filters],
    queryFn: ({ pageParam = 1 }) => 
      feedService.getWorldFeed({ ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => 
      lastPage.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Auto-load more when scrolling
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      isLiked ? forumService.unlikePost(postId) : forumService.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['worldFeed'] });
      
      const previousData = queryClient.getQueryData(['worldFeed', filters]);
      
      queryClient.setQueryData(['worldFeed', filters], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: Post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  isLiked: !isLiked,
                  likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
                };
              }
              return post;
            }),
          })),
        };
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(['worldFeed', filters], context.previousData);
      }
      
      toast({
        title: 'Action failed',
        description: 'Failed to update post. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  // Bookmark post mutation
  const bookmarkPostMutation = useMutation({
    mutationFn: ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) =>
      isBookmarked ? forumService.unbookmarkPost(postId) : forumService.bookmarkPost(postId),
    onMutate: async ({ postId, isBookmarked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['worldFeed'] });
      
      const previousData = queryClient.getQueryData(['worldFeed', filters]);
      
      queryClient.setQueryData(['worldFeed', filters], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: Post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  isBookmarked: !isBookmarked,
                };
              }
              return post;
            }),
          })),
        };
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['worldFeed', filters], context.previousData);
      }
      
      toast({
        title: 'Action failed',
        description: 'Failed to bookmark post. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const handleLike = useCallback((post: Post) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to like posts.',
        variant: 'destructive',
      });
      return;
    }
    
    likePostMutation.mutate({ postId: post.id, isLiked: post.isLiked || false });
  }, [user, likePostMutation, toast]);

  const handleBookmark = useCallback((post: Post) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to bookmark posts.',
        variant: 'destructive',
      });
      return;
    }
    
    bookmarkPostMutation.mutate({ postId: post.id, isBookmarked: post.isBookmarked || false });
  }, [user, bookmarkPostMutation, toast]);

  const handleShare = useCallback((post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast({
        title: 'Link copied',
        description: 'Post link copied to clipboard.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    }
  }, [toast]);

  // Get all posts from all pages
  const allPosts = postsData?.pages.flatMap(page => page.data) || [];

  // Get popular tags for filter
  const popularTags = [
    'javascript', 'react', 'typescript', 'python', 'career', 
    'interview', 'frontend', 'backend', 'devops', 'design'
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Failed to load feed</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Something went wrong while loading posts.'}
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">World Feed</h1>
          <Button
            size="sm"
            onClick={() => refetch()}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={() => setShowCreatePost(true)}
          className="sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Feed Type Tabs */}
            <Tabs value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
              <TabsList>
                <TabsTrigger value="latest" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Latest
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="following" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Following
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Tag Filter */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tags</SelectItem>
                {popularTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {allPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                {activeFilter === 'following' 
                  ? "Follow some users to see their posts here."
                  : selectedTag
                  ? `No posts found with the tag "${selectedTag}".`
                  : "Be the first to share something with the community!"
                }
              </p>
              <Button onClick={() => setShowCreatePost(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          allPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
                      <AvatarFallback>
                        {post.author.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{post.author.displayName}</h4>
                        {post.author.verified && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="space-y-3 mb-4">
                  {post.title && (
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                  )}
                  
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => setSelectedTag(tag.name)}
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post)}
                      className={`gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} 
                      />
                      {post.likesCount > 0 && post.likesCount}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {post.repliesCount > 0 && post.repliesCount}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(post)}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmark(post)}
                    className={post.isBookmarked ? 'text-yellow-500' : ''}
                  >
                    <Bookmark 
                      className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} 
                    />
                  </Button>
                </div>

                {/* Engagement Stats */}
                {(post.likesCount > 0 || post.repliesCount > 0) && (
                  <div className="flex items-center gap-4 pt-3 text-sm text-muted-foreground">
                    {post.likesCount > 0 && (
                      <span>{post.likesCount} like{post.likesCount !== 1 ? 's' : ''}</span>
                    )}
                    {post.repliesCount > 0 && (
                      <span>{post.repliesCount} repl{post.repliesCount !== 1 ? 'ies' : 'y'}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading more posts...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* End of Feed */}
        {!hasNextPage && allPosts.length > 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                You've reached the end of the feed!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}