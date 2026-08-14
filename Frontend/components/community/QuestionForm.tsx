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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  HelpCircle,
  Plus,
  X,
  Loader2,
  Hash,
  Lightbulb,
  Code,
  Briefcase,
  Users,
  Zap,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Info,
  Star,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const questionSchema = z.object({
  title: z.string()
    .min(15, 'Question title must be at least 15 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(50, 'Question details must be at least 50 characters')
    .max(5000, 'Content must be less than 5000 characters'),
  category: z.enum(['technical', 'career', 'learning', 'general']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string())
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed'),
  expectedAnswerType: z.enum(['explanation', 'code', 'resource', 'opinion']),
  isUrgent: z.boolean(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const questionCategories = [
  { 
    value: 'technical', 
    label: 'Technical',
    icon: Code,
    description: 'Programming, debugging, architecture questions',
    examples: ['How to implement authentication?', 'React state management best practices']
  },
  { 
    value: 'career', 
    label: 'Career',
    icon: Briefcase,
    description: 'Job search, interviews, career development',
    examples: ['How to prepare for technical interviews?', 'Salary negotiation tips']
  },
  { 
    value: 'learning', 
    label: 'Learning',
    icon: BookOpen,
    description: 'Study paths, resources, skill development',
    examples: ['Best way to learn React?', 'Roadmap for becoming a DevOps engineer']
  },
  { 
    value: 'general', 
    label: 'General',
    icon: Users,
    description: 'General discussions, community questions',
    examples: ['What are your favorite dev tools?', 'Industry trends discussion']
  },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner', color: 'text-green-600', description: 'New to programming or the topic' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600', description: 'Some experience, looking to deepen knowledge' },
  { value: 'advanced', label: 'Advanced', color: 'text-red-600', description: 'Experienced, complex technical questions' },
];

const answerTypes = [
  { value: 'explanation', label: 'Explanation', icon: Info, description: 'Conceptual explanation or theory' },
  { value: 'code', label: 'Code Example', icon: Code, description: 'Working code or implementation' },
  { value: 'resource', label: 'Resources', icon: BookOpen, description: 'Links, tutorials, or learning materials' },
  { value: 'opinion', label: 'Opinion/Experience', icon: Star, description: 'Personal experiences or opinions' },
];

export function QuestionForm({ className, onSuccess, onCancel }: QuestionFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch popular tags by category
  const { data: popularTags } = useQuery({
    queryKey: ['tags', 'popular', selectedCategory],
    queryFn: () => forumService.getPopularTags(20, selectedCategory || undefined),
    enabled: !!selectedCategory,
  });

  // Fetch similar questions for duplicate detection
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'technical',
      difficulty: 'beginner',
      tags: [],
      expectedAnswerType: 'explanation',
      isUrgent: false,
    },
  });

  const watchedTitle = watch('title');
  const watchedContent = watch('content');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags');

  // Update selected category when form category changes
  React.useEffect(() => {
    setSelectedCategory(watchedCategory);
  }, [watchedCategory]);

  // Check for similar questions
  const { data: similarQuestions } = useQuery({
    queryKey: ['similar-questions', watchedTitle],
    queryFn: () => forumService.searchSimilarQuestions(watchedTitle),
    enabled: watchedTitle.length > 20,
    staleTime: 1000 * 60, // 1 minute
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => feedService.createPost(data),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['worldFeed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      
      toast({
        title: 'Question posted',
        description: 'Your question has been published and is now live!',
        icon: <CheckCircle className="h-4 w-4" />,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/community/thread/${newPost.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to post question',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const onSubmit = async (data: QuestionFormData) => {
    if (!user) return;

    const questionData: any = {
      title: data.title,
      content: data.content,
      type: 'question',
      visibility: 'public',
      tags: data.tags,
      metadata: {
        category: data.category,
        difficulty: data.difficulty,
        expectedAnswerType: data.expectedAnswerType,
        isUrgent: data.isUrgent,
      },
      author: {
        id: user.id || 'u_current',
        username: user.username || 'john_mentor',
        displayName: user.displayName || 'John Evaluator',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        reputation: 150
      }
    };

    await createQuestionMutation.mutateAsync(questionData);
  };

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (watchedTags.includes(trimmedTag)) {
      toast({
        title: 'Tag already added',
        description: 'This tag is already selected.',
        variant: 'destructive',
      });
      return;
    }

    if (watchedTags.length >= 5) {
      toast({
        title: 'Too many tags',
        description: 'Maximum 5 tags allowed.',
        variant: 'destructive',
      });
      return;
    }

    setValue('tags', [...watchedTags, trimmedTag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Join to ask questions</h3>
          <p className="text-muted-foreground mb-4">
            Sign up to ask questions and get help from the community.
          </p>
          <Button>Sign Up</Button>
        </CardContent>
      </Card>
    );
  }

  const currentCategory = questionCategories.find(cat => cat.value === watchedCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Ask a Question</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={previewMode ? 'preview' : 'write'} onValueChange={(value) => setPreviewMode(value === 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="write">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Category Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {questionCategories.map((category) => {
                        const IconComponent = category.icon;
                        const isSelected = watchedCategory === category.value;
                        
                        return (
                          <Card 
                            key={category.value}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setValue('category', category.value as any)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <IconComponent className={`h-5 w-5 mt-0.5 ${
                                  isSelected ? 'text-primary' : 'text-muted-foreground'
                                }`} />
                                <div>
                                  <h4 className="font-medium">{category.label}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {category.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Title */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question Title</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Be specific and clear. A good title helps others find and answer your question.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="e.g., How do I implement user authentication in React?"
                        {...register('title')}
                        error={errors.title?.message}
                        className="text-black bg-white placeholder:text-slate-400"
                      />
                      <div className="text-sm text-muted-foreground">
                        {watchedTitle.length}/200 characters
                      </div>
                    </div>

                    {/* Similar Questions */}
                    {similarQuestions && similarQuestions.length > 0 && (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-2">
                              Similar questions found
                            </h4>
                            <div className="space-y-2">
                              {similarQuestions.slice(0, 3).map((q) => (
                                <div key={q.id}>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 text-left text-yellow-700 hover:text-yellow-900"
                                    onClick={() => router.push(`/community/thread/${q.id}`)}
                                  >
                                    {q.title}
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <p className="text-sm text-yellow-700 mt-2">
                              Consider checking these before posting your question.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question Details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Provide context, what you've tried, and specific details about your problem.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={`Describe your question in detail. Include:
• What you're trying to achieve
• What you've already tried
• Any error messages or unexpected behavior
• Relevant code snippets (if applicable)
• Your environment (if relevant)`}
                      rows={8}
                      {...register('content')}
                      error={errors.content?.message}
                      className="text-black bg-white placeholder:text-slate-400"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Markdown supported</span>
                      <span>{watchedContent.length}/5000 characters</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Difficulty */}
                    <div className="space-y-3">
                      <Label>Difficulty Level</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {difficultyLevels.map((level) => {
                          const isSelected = watch('difficulty') === level.value;
                          
                          return (
                            <Card 
                              key={level.value}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                              }`}
                              onClick={() => setValue('difficulty', level.value as any)}
                            >
                              <CardContent className="p-3 text-center">
                                <div className={`font-medium ${level.color}`}>
                                  {level.label}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {level.description}
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expected Answer Type */}
                    <div className="space-y-3">
                      <Label>What type of answer are you looking for?</Label>
                      <Select 
                        value={watch('expectedAnswerType')} 
                        onValueChange={(value: any) => setValue('expectedAnswerType', value)}
                      >
                        <SelectTrigger className="text-black bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {answerTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  <div>
                                    <div>{type.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {type.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 tags to help categorize your question.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        disabled={!tagInput.trim() || watchedTags.length >= 5}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Selected Tags */}
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag) => (
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
                        <p className="text-sm text-muted-foreground">Popular tags for {currentCategory?.label}:</p>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.slice(0, 8).map((tag) => (
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
                      {watchedTags.length}/5 tags selected
                    </p>
                    
                    {errors.tags && (
                      <p className="text-sm text-destructive">{errors.tags.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing Question...
                      </>
                    ) : (
                      <>
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Post Question
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      } else {
                        router.push('/community');
                      }
                    }}
                    disabled={isSubmitting}
                    className="text-black border-slate-300 bg-white hover:bg-slate-100 hover:text-black sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={watchedCategory === 'question' ? 'default' : 'secondary'}>
                      question
                    </Badge>
                    <Badge variant="outline">
                      {watch('difficulty')}
                    </Badge>
                  </div>
                  <h1 className="text-xl font-bold mt-3">
                    {watchedTitle || 'Your question title will appear here'}
                  </h1>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      <AvatarFallback className="text-sm">
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">just now</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {watchedContent || 'Your question details will appear here'}
                  </div>
                  
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {watchedTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5" />
                Writing Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Be specific in your title</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Include what you've tried</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Add relevant code snippets</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Use appropriate tags</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Be respectful and clear</span>
              </div>
            </CardContent>
          </Card>

          {/* Category Examples */}
          {currentCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <currentCategory.icon className="h-5 w-5" />
                  {currentCategory.label} Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentCategory.examples.map((example, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    "e.g., {example}"
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Questions today:</span>
                <span className="font-medium">47</span>
              </div>
              <div className="flex justify-between">
                <span>Answered questions:</span>
                <span className="font-medium">89%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. response time:</span>
                <span className="font-medium">2.3 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}