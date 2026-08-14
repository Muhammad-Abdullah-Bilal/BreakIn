'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService, forumService } from '@/lib/services/identity-api';
import { Post, PostFilters, CreatePostRequest } from '@/lib/types/community';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function useInView() {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, inView };
}

interface WorldFeedProps {
  className?: string;
}

export function WorldFeed({ className }: WorldFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'latest' | 'trending' | 'following'>('latest');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Comment Section states
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit Post states
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
  
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
      isLiked ? feedService.unlikePost(postId) : feedService.likePost(postId),
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
      isBookmarked ? feedService.unbookmarkPost(postId) : feedService.bookmarkPost(postId),
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

  const handleToggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    
    setActiveCommentsPostId(postId);
    setLoadingCommentsPostId(postId);
    try {
      const res = await feedService.getComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: res.data || [] }));
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingCommentsPostId(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim() || !user) return;
    setSubmittingComment(true);
    try {
      const res = await feedService.createComment(postId, {
        content: newCommentText.trim(),
        author: {
          id: user.id || 'u_current',
          username: user.username || 'john_mentor',
          displayName: user.displayName || 'John Evaluator',
          avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        }
      });
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res]
      }));
      setNewCommentText('');
      
      // Update local item list count helper
      queryClient.setQueryData(['worldFeed', filters], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: Post) => {
              if (p.id === postId) {
                return {
                  ...p,
                  repliesCount: (p.repliesCount || 0) + 1
                };
              }
              return p;
            })
          }))
        };
      });
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast({
        title: "Failed to add comment",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setUpdatingPostId(editingPost.id);
    try {
      await feedService.updatePost(editingPost.id, {
        title: editTitle,
        content: editContent
      });
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ['worldFeed'] });
      toast({
        title: "Post updated",
        description: "Your post has been successfully updated.",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (err) {
      console.error("Failed to update post:", err);
      toast({
        title: "Update failed",
        description: "Could not update your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingPostId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await feedService.deletePost(postId);
      queryClient.invalidateQueries({ queryKey: ['worldFeed'] });
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast({
        title: "Delete failed",
        description: "Could not delete your post. Please try again.",
        variant: "destructive"
      });
    }
  };

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
                      <AvatarImage src={post.author?.avatarUrl || (post.author as any)?.avatar} alt={post.author?.displayName || 'Anonymous'} />
                      <AvatarFallback>
                        {(post.author?.displayName || 'Anonymous').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{post.author?.displayName || 'Anonymous'}</h4>
                        {post.author?.verified && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border border-slate-800 text-slate-200">
                      {user && (user.id === post.author?.id || user.username === post.author?.username) ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleStartEdit(post)}
                            className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                          >
                            <Edit className="h-4 w-4 text-violet-400" />
                            <span>Edit Post</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Post</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Post Reported",
                              description: "Thank you for reporting. Our moderators will review this post shortly.",
                              icon: <CheckCircle className="h-4 w-4 text-green-500" />
                            });
                          }}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                        >
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span>Report Post</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, idx) => {
                        const tagId = typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : `tag-${idx}`;
                        const tagName = typeof tag === 'object' && tag && 'name' in tag ? (tag as any).name : String(tag);
                        return (
                          <Badge 
                            key={tagId} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setSelectedTag(tagName)}
                          >
                            #{tagName}
                          </Badge>
                        );
                      })}
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
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 ${activeCommentsPostId === post.id ? 'text-violet-500' : ''}`}
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.repliesCount || 0}</span>
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

                {/* Collapsible Comments Section */}
                {activeCommentsPostId === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300">Comments</h4>
                    
                    {/* Add Comment Input */}
                    {user ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="text-black bg-white flex-1 text-sm h-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingComment || !newCommentText.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Please log in to write comments.</p>
                    )}

                    {/* Comments List */}
                    {loadingCommentsPostId === post.id ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Loading comments...</span>
                      </div>
                    ) : !commentsMap[post.id] || commentsMap[post.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No comments yet. Be the first to reply!</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {commentsMap[post.id].map((comment: any) => (
                          <div key={comment.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={comment.author?.avatarUrl || comment.author?.avatar} alt={comment.author?.displayName || 'User'} />
                                  <AvatarFallback className="text-[10px]">
                                    {(comment.author?.displayName || 'U').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-semibold text-slate-200">
                                  {comment.author?.displayName || 'Anonymous'}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 pl-8 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
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

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Edit Post</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-black bg-white rounded-md p-2 border border-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full text-black bg-white rounded-md p-2 border border-slate-700 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingPost(null)}
                className="text-black bg-white border-slate-300 hover:bg-slate-100 hover:text-black"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updatingPostId !== null}>
                {updatingPostId ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}