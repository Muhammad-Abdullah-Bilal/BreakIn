'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/lib/services/identity-api';
import { Article, ArticleComment, CreateCommentRequest } from '@/lib/types/content';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Textarea } from '@/components/ui/Textarea';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import { 
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  Calendar,
  User,
  Tag,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  ChevronRight,
  Home,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

interface ArticleViewProps {
  articleSlug: string;
  className?: string;
}

interface TableOfContentsProps {
  headings: { id: string; level: number; text: string }[];
  activeHeading: string;
}

interface CommentItemProps {
  comment: ArticleComment;
  articleId: string;
  onReply: (commentId: string) => void;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
  onFlag: (commentId: string) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, activeHeading }) => {
  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Table of Contents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {headings.map((heading) => (
          <div key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm transition-colors hover:text-primary ${
                activeHeading === heading.id ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              {heading.text}
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, articleId, onReply, onVote, onFlag }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { user } = useAuth();

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatarUrl} alt={comment.author.displayName} />
                <AvatarFallback className="text-xs">
                  {comment.author.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.author.displayName}</span>
                  {comment.isHighlighted && (
                    <Badge variant="secondary" className="text-xs">
                      Author
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  {comment.updatedAt !== comment.createdAt && ' (edited)'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                {comment.voteScore > 0 && '+'}
                {comment.voteScore}
              </div>
              
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(comment.id, 'up')}
                  className={`h-8 w-8 p-0 ${comment.userVote === 'up' ? 'text-green-600' : ''}`}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(comment.id, 'down')}
                  className={`h-8 w-8 p-0 ${comment.userVote === 'down' ? 'text-red-600' : ''}`}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-8 px-2"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFlag(comment.id)}
                className="h-8 px-2"
              >
                <Flag className="h-3 w-3 mr-1" />
                Flag
              </Button>
            </div>

            {user?.id === comment.author.id && (
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
        </CardContent>
      </Card>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              onReply={onReply}
              onVote={onVote}
              onFlag={onFlag}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-8">
          <CommentForm
            articleId={articleId}
            parentId={comment.id}
            onSuccess={() => setShowReplyForm(false)}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
};

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ articleId, parentId, onSuccess, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const commentMutation = useMutation({
    mutationFn: (data: CreateCommentRequest) => contentService.createComment(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articleComments', articleId] });
      setContent('');
      onSuccess();
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Comment failed',
        description: error.message || 'Failed to post comment.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    await commentMutation.mutateAsync({
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
            placeholder="Write your comment..."
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
              disabled={!content.trim() || commentMutation.isPending}
            >
              {commentMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export function ArticleView({ articleSlug, className }: ArticleViewProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [mdxSource, setMdxSource] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch article
  const {
    data: article,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['article', articleSlug],
    queryFn: () => contentService.getBySlug(articleSlug),
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ['articleComments', article?.id],
    queryFn: () => contentService.getComments(article!.id),
    enabled: !!article,
  });

  // Fetch related articles
  const { data: relatedArticles } = useQuery({
    queryKey: ['relatedArticles', article?.id],
    queryFn: () => contentService.getRelated(article!.id, 4),
    enabled: !!article,
  });

  // Process MDX content
  useEffect(() => {
    const processMDX = async () => {
      if (article?.content) {
        try {
          const source = await serialize(article.content);
          setMdxSource(source);
        } catch (error) {
          console.error('Failed to process MDX:', error);
        }
      }
    };

    processMDX();
  }, [article?.content]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(Math.min(scrolled, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active heading
  useEffect(() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));
    
    return () => observer.disconnect();
  }, [mdxSource]);

  // Like article mutation
  const likeArticleMutation = useMutation({
    mutationFn: () => contentService.likeArticle(article!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      toast({
        title: 'Article liked',
        description: 'Thanks for your feedback!',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
  });

  // Bookmark article mutation
  const bookmarkArticleMutation = useMutation({
    mutationFn: () => contentService.bookmarkArticle(article!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      toast({
        title: 'Article bookmarked',
        description: 'Article saved to your bookmarks.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Article link copied to clipboard.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    }
  };

  const handleVoteComment = (commentId: string, voteType: 'up' | 'down') => {
    // Comment voting mutation would go here
    console.log('Vote comment:', commentId, voteType);
  };

  const handleFlagComment = (commentId: string) => {
    // Comment flagging mutation would go here
    console.log('Flag comment:', commentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Article not found</h3>
          <p className="text-muted-foreground mb-4">
            This article may have been removed or you don't have permission to view it.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Extract headings for table of contents
  const headings = mdxSource ? [] : []; // Would extract from MDX in real implementation

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Reading Progress */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 rounded-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/knowledge-base" className="hover:text-foreground">
              Knowledge Base
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/knowledge-base/category/${article.category.slug}`} className="hover:text-foreground">
              {article.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="truncate">{article.title}</span>
          </nav>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                {article.difficulty}
              </Badge>
              <Badge variant="secondary">{article.category.name}</Badge>
              {article.isBookmarked && (
                <Badge variant="outline">
                  <Bookmark className="h-3 w-3 mr-1" />
                  Bookmarked
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">{article.title}</h1>
            
            <p className="text-lg text-muted-foreground">{article.excerpt}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={article.author.avatarUrl} alt={article.author.displayName} />
                  <AvatarFallback>
                    {article.author.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>By {article.author.displayName}</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(article.publishedAt), 'MMM dd, yyyy')}</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{article.readingTime} min read</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.views} views</span>
              </div>
            </div>

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          )}

          {/* Article Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {mdxSource ? (
                  <MDXRemote {...mdxSource} />
                ) : (
                  <div className="whitespace-pre-wrap">{article.content}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Article Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => likeArticleMutation.mutate()}
                    disabled={likeArticleMutation.isPending}
                    className={article.isLiked ? 'text-red-500 border-red-200' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${article.isLiked ? 'fill-current' : ''}`} />
                    {article.likesCount} {article.likesCount === 1 ? 'Like' : 'Likes'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => bookmarkArticleMutation.mutate()}
                    disabled={bookmarkArticleMutation.isPending}
                    className={article.isBookmarked ? 'text-yellow-600 border-yellow-200' : ''}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${article.isBookmarked ? 'fill-current' : ''}`} />
                    {article.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span>{article.rating.toFixed(1)} ({article.ratingsCount} ratings)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments?.length || 0})
                </CardTitle>
                
                {user && (
                  <Button onClick={() => setShowCommentForm(!showCommentForm)}>
                    Add Comment
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Comment Form */}
              {showCommentForm && user && (
                <CommentForm
                  articleId={article.id}
                  onSuccess={() => setShowCommentForm(false)}
                  onCancel={() => setShowCommentForm(false)}
                />
              )}

              {/* Comments List */}
              {comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      articleId={article.id}
                      onReply={() => {}}
                      onVote={handleVoteComment}
                      onFlag={handleFlagComment}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                  {user && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowCommentForm(true)}
                    >
                      Add Comment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Table of Contents */}
          {headings.length > 0 && (
            <TableOfContents headings={headings} activeHeading={activeHeading} />
          )}

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About the Author</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={article.author.avatarUrl} alt={article.author.displayName} />
                  <AvatarFallback>
                    {article.author.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{article.author.displayName}</h4>
                  <p className="text-sm text-muted-foreground">{article.author.role}</p>
                </div>
              </div>
              
              {article.author.bio && (
                <p className="text-sm text-muted-foreground">{article.author.bio}</p>
              )}
              
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/profile/${article.author.id}`}>
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Articles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedArticles.map((related) => (
                  <div key={related.id} className="space-y-2">
                    <Link 
                      href={`/knowledge-base/${related.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                    >
                      {related.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{related.readingTime} min read</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{related.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}