'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/lib/services/identity-api';
import { Thread, Reply, CreateReplyRequest, Vote, ModerationFlag } from '@/lib/types/community';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Flag,
  Reply as ReplyIcon,
  Edit,
  Trash2,
  Pin,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  Send,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CreatePostForm } from './CreatePostForm';

interface ThreadViewProps {
  threadId: string;
  className?: string;
}

interface ReplyItemProps {
  reply: Reply;
  threadId: string;
  level?: number;
  onVote: (replyId: string, voteType: 'up' | 'down') => void;
  onFlag: (replyId: string, reason: string) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ 
  reply, 
  threadId, 
  level = 0, 
  onVote, 
  onFlag 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const maxNestLevel = 3;

  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to vote.',
        variant: 'destructive',
      });
      return;
    }
    onVote(reply.id, voteType);
  };

  const handleFlag = () => {
    if (!flagReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for flagging.',
        variant: 'destructive',
      });
      return;
    }
    
    onFlag(reply.id, flagReason);
    setShowFlagForm(false);
    setFlagReason('');
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''} space-y-4`}>
      {/* Reply Content */}
      <Card className={reply.isHighlighted ? 'ring-2 ring-primary' : ''}>
        <CardContent className="p-4">
          {/* Reply Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reply.author.avatarUrl} alt={reply.author.displayName} />
                <AvatarFallback className="text-xs">
                  {reply.author.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{reply.author.displayName}</span>
                  {reply.author.verified && (
                    <CheckCircle className="h-3 w-3 text-blue-500" />
                  )}
                  {reply.isAccepted && (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accepted
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  {reply.updatedAt !== reply.createdAt && ' (edited)'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Vote Score */}
              <div className="flex items-center gap-1 text-sm font-medium">
                {reply.voteScore > 0 && '+'}
                {reply.voteScore}
              </div>
              
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reply Text */}
          <div className="mb-3">
            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
          </div>

          {/* Reply Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Voting */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('up')}
                  className={`h-8 w-8 p-0 ${reply.userVote === 'up' ? 'text-green-600' : ''}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('down')}
                  className={`h-8 w-8 p-0 ${reply.userVote === 'down' ? 'text-red-600' : ''}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Reply Button */}
              {level < maxNestLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-2"
                >
                  <ReplyIcon className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {/* Flag Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFlagForm(!showFlagForm)}
                className="h-8 px-2"
              >
                <Flag className="h-3 w-3 mr-1" />
                Flag
              </Button>
            </div>

            {/* Author Actions */}
            {user?.id === reply.author.id && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Flag Form */}
          {showFlagForm && (
            <div className="mt-3 p-3 border rounded-lg bg-muted/50 space-y-3">
              <div>
                <label className="text-sm font-medium">Reason for flagging:</label>
                <Select value={flagReason} onValueChange={setFlagReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                    <SelectItem value="misinformation">Misinformation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFlag} disabled={!flagReason}>
                  Submit Flag
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowFlagForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-4">
          <ReplyForm
            threadId={threadId}
            parentId={reply.id}
            onSuccess={() => setShowReplyForm(false)}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="space-y-4">
          {reply.replies.map((nestedReply) => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              threadId={threadId}
              level={level + 1}
              onVote={onVote}
              onFlag={onFlag}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ReplyFormProps {
  threadId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ threadId, parentId, onSuccess, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (data: CreateReplyRequest) => forumService.createReply(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      setContent('');
      onSuccess();
      
      toast({
        title: 'Reply posted',
        description: 'Your reply has been added to the discussion.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Reply failed',
        description: error.message || 'Failed to post reply.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    await replyMutation.mutateAsync({
      content: content.trim(),
      parentId,
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
              <AvatarFallback className="text-xs">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.displayName}</span>
          </div>
          
          <Textarea
            placeholder="Write your reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={!content.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export function ThreadView({ threadId, className }: ThreadViewProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'votes'>('votes');
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch thread data
  const {
    data: thread,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => forumService.getThread(threadId),
  });

  // Vote on reply mutation
  const voteReplyMutation = useMutation({
    mutationFn: ({ replyId, voteType }: { replyId: string; voteType: 'up' | 'down' }) =>
      forumService.voteReply(replyId, voteType),
    onMutate: async ({ replyId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] });
      
      const previousData = queryClient.getQueryData(['thread', threadId]);
      
      // Optimistic update logic here
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['thread', threadId], context.previousData);
      }
      toast({
        title: 'Vote failed',
        description: 'Failed to record your vote.',
        variant: 'destructive',
      });
    },
  });

  // Flag reply mutation
  const flagReplyMutation = useMutation({
    mutationFn: ({ replyId, reason }: { replyId: string; reason: string }) =>
      forumService.flagReply(replyId, reason),
    onSuccess: () => {
      toast({
        title: 'Reply flagged',
        description: 'Thank you for helping keep the community safe.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
    onError: () => {
      toast({
        title: 'Flag failed',
        description: 'Failed to flag reply.',
        variant: 'destructive',
      });
    },
  });

  const handleVote = useCallback((replyId: string, voteType: 'up' | 'down') => {
    voteReplyMutation.mutate({ replyId, voteType });
  }, [voteReplyMutation]);

  const handleFlag = useCallback((replyId: string, reason: string) => {
    flagReplyMutation.mutate({ replyId, reason });
  }, [flagReplyMutation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Thread not found</h3>
          <p className="text-muted-foreground mb-4">
            This thread may have been deleted or you don't have permission to view it.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const sortedReplies = [...(thread.replies || [])].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'votes':
        return b.voteScore - a.voteScore;
      default:
        return 0;
    }
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/community">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
        </Button>
      </div>

      {/* Thread Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={thread.type === 'question' ? 'default' : 'secondary'}>
                  {thread.type}
                </Badge>
                {thread.isPinned && (
                  <Badge variant="outline">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {thread.isLocked && (
                  <Badge variant="destructive">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold">{thread.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={thread.author.avatarUrl} alt={thread.author.displayName} />
                    <AvatarFallback className="text-xs">
                      {thread.author.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{thread.author.displayName}</span>
                </div>
                
                <span>•</span>
                <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                
                <span>•</span>
                <span>{thread.repliesCount} replies</span>
                
                <span>•</span>
                <span>{thread.viewsCount} views</span>
              </div>

              {/* Tags */}
              {thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {thread.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="whitespace-pre-wrap">{thread.content}</p>
        </CardContent>
      </Card>

      {/* Reply Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {thread.repliesCount} Replies
          </h2>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Best
                </div>
              </SelectItem>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Newest
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Oldest
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!thread.isLocked && (
          <Button onClick={() => setShowReplyForm(!showReplyForm)}>
            <ReplyIcon className="h-4 w-4 mr-2" />
            Reply
          </Button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && !thread.isLocked && (
        <ReplyForm
          threadId={threadId}
          onSuccess={() => setShowReplyForm(false)}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* Replies */}
      <div className="space-y-4">
        {sortedReplies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No replies yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to contribute to this discussion!
              </p>
              {!thread.isLocked && (
                <Button onClick={() => setShowReplyForm(true)}>
                  <ReplyIcon className="h-4 w-4 mr-2" />
                  Add Reply
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              threadId={threadId}
              onVote={handleVote}
              onFlag={handleFlag}
            />
          ))
        )}
      </div>

      {/* Locked Message */}
      {thread.isLocked && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Lock className="h-5 w-5" />
              <span className="font-medium">This thread is locked</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              No new replies can be added to this discussion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}