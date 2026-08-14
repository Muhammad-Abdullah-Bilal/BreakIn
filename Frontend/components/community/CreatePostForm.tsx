'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forumService, feedService } from '@/lib/services/identity-api';
import { CreatePostRequest, Tag } from '@/lib/types/community';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus,
  X,
  Loader2,
  Tag as TagIcon,
  Hash,
  Globe,
  Users,
  Lock,
  Image,
  Link as LinkIcon,
  Type,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const createPostSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(20, 'Content must be at least 20 characters')
    .max(5000, 'Content must be less than 5000 characters'),
  type: z.enum(['discussion', 'question', 'announcement', 'showcase']),
  visibility: z.enum(['public', 'followers', 'private']),
  tags: z.array(z.string())
    .max(5, 'Maximum 5 tags allowed'),
  threadId: z.string().optional(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  threadId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CreatePostForm({ threadId, onSuccess, onCancel, className }: CreatePostFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ['tags', 'popular'],
    queryFn: () => forumService.getPopularTags(20),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'discussion',
      visibility: 'public',
      tags: [],
      threadId,
    },
  });

  const selectedTags = watch('tags');
  const postType = watch('type');
  const content = watch('content');

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => feedService.createPost(data),
    onSuccess: (newPost) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['worldFeed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      
      if (threadId) {
        queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      }

      reset();
      setIsOpen(false);
      onSuccess?.();
      
      toast({
        title: 'Post created',
        description: 'Your post has been published successfully.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Post creation failed',
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const onSubmit = async (data: CreatePostFormData) => {
    if (!user) return;

    const postData: any = {
      title: data.title,
      content: data.content,
      type: data.type,
      visibility: data.visibility,
      tags: data.tags,
      threadId: data.threadId,
      author: {
        id: user.id || 'u_current',
        username: user.username || 'john_mentor',
        displayName: user.displayName || 'John Evaluator',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        reputation: 150
      }
    };

    await createPostMutation.mutateAsync(postData);
  };

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (selectedTags.includes(trimmedTag)) {
      toast({
        title: 'Tag already added',
        description: 'This tag is already selected.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTags.length >= 5) {
      toast({
        title: 'Too many tags',
        description: 'Maximum 5 tags allowed.',
        variant: 'destructive',
      });
      return;
    }

    setValue('tags', [...selectedTags, trimmedTag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="h-4 w-4" />;
      case 'announcement':
        return <Globe className="h-4 w-4" />;
      case 'showcase':
        return <Type className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Join the conversation</h3>
          <p className="text-muted-foreground mb-4">
            Log in to create posts and engage with the community.
          </p>
          <Button>Log In</Button>
        </CardContent>
      </Card>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Author Info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback>
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">
            Creating a new post
          </p>
        </div>
      </div>

      {/* Post Type and Visibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Post Type</Label>
          <Select
            value={postType}
            onValueChange={(value: any) => setValue('type', value)}
          >
            <SelectTrigger className="text-black bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discussion">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Discussion
                </div>
              </SelectItem>
              <SelectItem value="question">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Question
                </div>
              </SelectItem>
              <SelectItem value="announcement">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Announcement
                </div>
              </SelectItem>
              <SelectItem value="showcase">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Showcase
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={watch('visibility')}
            onValueChange={(value: any) => setValue('visibility', value)}
          >
            <SelectTrigger className="text-black bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Followers Only
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="What's on your mind?"
          {...register('title')}
          error={errors.title?.message}
          className="text-black bg-white placeholder:text-slate-400"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder="Share your thoughts, ask a question, or start a discussion..."
          rows={6}
          {...register('content')}
          error={errors.content?.message}
          className="text-black bg-white placeholder:text-slate-400"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Markdown supported</span>
          <span>{content?.length || 0}/5000</span>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label>Tags</Label>
        
        {/* Tag Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add tags..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            className="text-black bg-white placeholder:text-slate-400 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(tagInput)}
            disabled={!tagInput.trim() || selectedTags.length >= 5}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                <Hash className="h-3 w-3" />
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Popular Tags */}
        {popularTags && popularTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Popular tags:</p>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => addTag(tag.name)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {selectedTags.length}/5 tags selected
        </p>
        
        {errors.tags && (
          <p className="text-sm text-destructive">{errors.tags.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              {getPostTypeIcon(postType)}
              <span className="ml-2">Publish Post</span>
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setIsOpen(false);
            onCancel?.();
          }}
          disabled={isSubmitting}
          className="text-black border-slate-300 bg-white hover:bg-slate-100 hover:text-black sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  // If onCancel is provided, the parent component is managing the modal wrapper, so we return formContent directly.
  if (onCancel) {
    return formContent;
  }

  // For threaded replies, render inline
  if (threadId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Add to Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // For main posts, use dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create New Post
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}