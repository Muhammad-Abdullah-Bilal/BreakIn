'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService, SubmissionService, FeedbackService } from '@/lib/services/api';
import { Review, Submission, FeedbackThread, RubricCriterion } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Slider } from '@/components/ui/Slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  MessageSquare, 
  Star, 
  Code,
  FileText,
  Calendar,
  Clock,
  User,
  Check,
  X,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { CodeViewer } from './CodeViewer';
import { FeedbackPanel } from '../feedback/FeedbackPanel';

interface ReviewDetailProps {
  reviewId: string;
  className?: string;
}

export function ReviewDetail({ reviewId, className }: ReviewDetailProps) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'rubric' | 'feedback'>('overview');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [finalComments, setFinalComments] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Fetch review details
  const {
    data: review,
    isLoading: reviewLoading,
    error: reviewError,
    refetch: refetchReview,
  } = useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: () => ReviewService.get(reviewId),
    enabled: !!reviewId,
  });

  // Fetch submission details
  const {
    data: submission,
    isLoading: submissionLoading,
  } = useQuery({
    queryKey: ['submissions', review?.submissionId],
    queryFn: () => SubmissionService.get(review!.submissionId),
    enabled: !!review?.submissionId,
  });

  // Fetch feedback threads
  const {
    data: feedbackThreads,
    refetch: refetchFeedback,
  } = useQuery({
    queryKey: ['feedback', 'threads', submission?.id],
    queryFn: () => FeedbackService.getThreads(submission!.id),
    enabled: !!submission?.id,
  });

  // Start review mutation
  const startReviewMutation = useMutation({
    mutationFn: () => ReviewService.start(reviewId),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(['reviews', reviewId], updatedReview);
    },
  });

  // Update rubric score mutation
  const updateScoreMutation = useMutation({
    mutationFn: ({ criterionId, score, comment }: { criterionId: string; score: number; comment?: string }) =>
      ReviewService.updateRubricScore(reviewId, criterionId, score, comment),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(['reviews', reviewId], updatedReview);
    },
  });

  // Complete review mutation
  const completeReviewMutation = useMutation({
    mutationFn: ({ timeSpent, finalComments }: { timeSpent: number; finalComments: string }) =>
      ReviewService.complete(reviewId, timeSpent, finalComments),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(['reviews', reviewId], updatedReview);
      queryClient.invalidateQueries({ queryKey: ['reviews', 'queue'] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!reviewId) return;

    const unsubscribeReview = subscribe(`reviews.${reviewId}`, (data: any) => {
      if (data.type === 'reviews.updated') {
        refetchReview();
      }
    });

    const unsubscribeFeedback = subscribe(`feedback.${submission?.id}`, (data: any) => {
      if (data.type === 'feedback.created' || data.type === 'feedback.updated') {
        refetchFeedback();
      }
    });

    return () => {
      unsubscribeReview();
      unsubscribeFeedback();
    };
  }, [reviewId, submission?.id, subscribe, refetchReview, refetchFeedback]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime]);

  // Initialize scores and comments from review
  useEffect(() => {
    if (review?.rubric.criteria) {
      const initialScores: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      
      review.rubric.criteria.forEach(criterion => {
        if (criterion.score !== undefined) {
          initialScores[criterion.id] = criterion.score;
        }
        if (criterion.comment) {
          initialComments[criterion.id] = criterion.comment;
        }
      });
      
      setScores(initialScores);
      setComments(initialComments);
    }

    if (review?.finalComments) {
      setFinalComments(review.finalComments);
    }
  }, [review]);

  const handleStartReview = () => {
    startReviewMutation.mutate();
  };

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
    
    // Auto-save score after 1 second
    setTimeout(() => {
      updateScoreMutation.mutate({
        criterionId,
        score,
        comment: comments[criterionId],
      });
    }, 1000);
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    setComments(prev => ({ ...prev, [criterionId]: comment }));
  };

  const handleCommentBlur = (criterionId: string) => {
    updateScoreMutation.mutate({
      criterionId,
      score: scores[criterionId] || 0,
      comment: comments[criterionId],
    });
  };

  const handleCompleteReview = () => {
    completeReviewMutation.mutate({
      timeSpent,
      finalComments,
    });
  };

  const canStartReview = review?.status === 'pending' && review.reviewerId === user?.id;
  const canComplete = review?.status === 'in_progress' && review.reviewerId === user?.id;
  const isCompleted = review?.status === 'completed';

  if (reviewLoading || submissionLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (reviewError || !review) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Failed to load review</p>
          <Button onClick={() => refetchReview()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const completedCriteria = review.rubric.criteria.filter(c => c.score !== undefined).length;
  const totalCriteria = review.rubric.criteria.length;
  const overallScore = totalCriteria > 0 
    ? review.rubric.criteria.reduce((sum, c) => sum + (c.score || 0), 0) / totalCriteria
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/mentor/reviews">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Review #{review.id.slice(-6)}</h1>
            <p className="text-muted-foreground">
              {review.type.replace('_', ' ')} • {review.status.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canStartReview && (
            <Button onClick={handleStartReview} disabled={startReviewMutation.isPending}>
              <Eye className="h-4 w-4 mr-2" />
              Start Review
            </Button>
          )}
          
          {canComplete && (
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={completedCriteria < totalCriteria}>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Review
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Final Comments</label>
                    <Textarea
                      value={finalComments}
                      onChange={(e) => setFinalComments(e.target.value)}
                      placeholder="Provide overall feedback and recommendations..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Time Spent: {timeSpent} minutes</span>
                    <span>Overall Score: {overallScore.toFixed(1)}/5</span>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {}}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCompleteReview}
                      disabled={completeReviewMutation.isPending}
                    >
                      Complete Review
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Review Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium">Review Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                </div>
                {review.claimedAt && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Claimed {formatDistanceToNow(new Date(review.claimedAt), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{timeSpent} minutes spent</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rubric Completion</span>
                  <span>{completedCriteria}/{totalCriteria}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(completedCriteria / totalCriteria) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Overall Score</span>
                  <span className="font-medium">{overallScore.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Submission Info</h3>
              {submission && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {submission.id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>by {submission.participantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Submitted {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rubric">
            Rubric ({completedCriteria}/{totalCriteria})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback ({feedbackThreads?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {submission && (
            <>
              {/* Submission Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {submission.description || 'No description provided'}
                    </p>
                  </div>

                  {submission.type === 'code' && submission.repositoryUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Repository</h4>
                      <Button asChild variant="outline" size="sm">
                        <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer">
                          <Code className="h-4 w-4 mr-2" />
                          View Repository
                        </a>
                      </Button>
                    </div>
                  )}

                  {submission.files.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Files</h4>
                      <div className="space-y-2">
                        {submission.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.filename}</span>
                              <Badge variant="outline" className="text-xs">
                                {file.type}
                              </Badge>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Code Viewer for code submissions */}
              {submission.type === 'code' && (
                <CodeViewer 
                  submission={submission}
                  onAddFeedback={(lineNumber, comment) => {
                    // Handle inline feedback
                  }}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rubric" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rubric Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {review.rubric.criteria.map((criterion) => (
                <RubricCriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  score={scores[criterion.id]}
                  comment={comments[criterion.id] || ''}
                  onScoreChange={(score) => handleScoreChange(criterion.id, score)}
                  onCommentChange={(comment) => handleCommentChange(criterion.id, comment)}
                  onCommentBlur={() => handleCommentBlur(criterion.id)}
                  disabled={isCompleted}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {submission && (
            <FeedbackPanel
              submissionId={submission.id}
              feedbackThreads={feedbackThreads || []}
              onRefresh={refetchFeedback}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RubricCriterionCardProps {
  criterion: RubricCriterion;
  score?: number;
  comment: string;
  onScoreChange: (score: number) => void;
  onCommentChange: (comment: string) => void;
  onCommentBlur: () => void;
  disabled: boolean;
}

function RubricCriterionCard({
  criterion,
  score,
  comment,
  onScoreChange,
  onCommentChange,
  onCommentBlur,
  disabled,
}: RubricCriterionCardProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{criterion.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {criterion.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {score || 0}/5
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Score</label>
            <div className="mt-2">
              <Slider
                value={[score || 0]}
                onValueChange={([value]) => onScoreChange(value)}
                min={0}
                max={5}
                step={0.5}
                disabled={disabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Comments</label>
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              onBlur={onCommentBlur}
              placeholder="Provide specific feedback for this criterion..."
              disabled={disabled}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}