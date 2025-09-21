import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  MessageSquare, 
  Eye, 
  ArrowRight,
  Star,
  Calendar,
  AlertCircle,
  Target
} from "lucide-react";
import { usePipeline, useMovePipelineCandidate, usePipelineSuggestion, useUpdatePipelineCandidate } from "@/hooks/useApi";
import { usePipelineSubscription } from "@/hooks/useRealtime";
import { PipelineItem, PipelineStage } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const PIPELINE_STAGES: { stage: PipelineStage; title: string; color: string }[] = [
  { stage: 'sourced', title: 'Sourced', color: 'bg-gray-100 text-gray-800' },
  { stage: 'shortlisted', title: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
  { stage: 'interview', title: 'Interview', color: 'bg-yellow-100 text-yellow-800' },
  { stage: 'offer', title: 'Offer', color: 'bg-purple-100 text-purple-800' },
  { stage: 'hired', title: 'Hired', color: 'bg-green-100 text-green-800' },
  { stage: 'rejected', title: 'Rejected', color: 'bg-red-100 text-red-800' },
];

export default function Pipeline() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const { data: pipelineItems, isLoading, error } = usePipeline();
  const moveCandidateMutation = useMovePipelineCandidate();
  const updateCandidateMutation = useUpdatePipelineCandidate();
  
  // Subscribe to pipeline updates
  usePipelineSubscription();
  
  // Get AI suggestion for selected item
  const { data: suggestion, isLoading: suggestionLoading } = usePipelineSuggestion(selectedItemId || '');

  const moveCandidate = (itemId: string, newStage: PipelineStage) => {
    moveCandidateMutation.mutate({ itemId, newStage });
  };

  const handleGetSuggestion = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleApplySuggestion = () => {
    if (selectedItemId && suggestion) {
      moveCandidate(selectedItemId, suggestion.stage);
      setSelectedItemId(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load pipeline data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getCandidatesByStage = (stage: PipelineStage) => {
    return pipelineItems?.filter(item => item.stage === stage) || [];
  };

  const PipelineCard = ({ item }: { item: PipelineItem }) => {
    const daysAgo = Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Handle card selection/focus
      }
    };
    
    return (
      <Card 
        className="mb-3 hover:shadow-md transition-shadow cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none" 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={`${item.candidate.name} - ${item.jobTitle} - ${item.stage} stage`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.candidate.avatar} />
                <AvatarFallback>
                  {item.candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold truncate">
                  {item.candidate.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground truncate">
                  {item.jobTitle}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGetSuggestion(item.id)}>
                  <Target className="w-4 h-4 mr-2" />
                  Get AI Suggestion
                </DropdownMenuItem>
                {PIPELINE_STAGES.filter(s => s.stage !== item.stage).map(stage => (
                  <DropdownMenuItem 
                    key={stage.stage}
                    onClick={() => moveCandidate(item.id, stage.stage)}
                    disabled={moveCandidateMutation.isPending}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to {stage.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Match Score */}
            {item.matchScore && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="text-xs text-muted-foreground">
                  {item.matchScore}% match
                </span>
              </div>
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-1">
              {item.candidate.skills.slice(0, 2).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs py-0">
                  {skill}
                </Badge>
              ))}
              {item.candidate.skills.length > 2 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{item.candidate.skills.length - 2}
                </Badge>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.notes}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const StageColumn = ({ stage, title, color }: { stage: PipelineStage; title: string; color: string }) => {
    const candidates = getCandidatesByStage(stage);
    
    return (
      <div className="flex-1 min-w-72">
        <div className="mb-4">
          <div className={`rounded-lg px-3 py-2 ${color} flex items-center justify-between`}>
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {candidates.length}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="mb-3">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {candidates.map((item) => (
                <PipelineCard key={item.id} item={item} />
              ))}
              
              {candidates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No candidates in this stage</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const totalCandidates = pipelineItems?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hiring Pipeline</h1>
          <p className="text-muted-foreground">
            Manage candidates through each stage of your hiring process
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{totalCandidates}</div>
          <div className="text-sm text-muted-foreground">Total Candidates</div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            {PIPELINE_STAGES.slice(0, -1).map((stage, index) => {
              const count = getCandidatesByStage(stage.stage).length;
              const isLast = index === PIPELINE_STAGES.length - 2;
              
              return (
                <div key={stage.stage} className="flex items-center">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center font-semibold`}>
                      {count}
                    </div>
                    <div className="text-xs mt-1 font-medium">{stage.title}</div>
                  </div>
                  {!isLast && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Board */}
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage.stage}
            stage={stage.stage}
            title={stage.title}
            color={stage.color}
          />
        ))}
      </div>

      {/* AI Suggestion Panel */}
      {selectedItemId && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  AI Stage Suggestion
                </CardTitle>
                <CardDescription>
                  Intelligent recommendation for next pipeline stage
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItemId(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {suggestionLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : suggestion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Recommended Stage: {suggestion.stage}</div>
                    <div className="text-sm text-muted-foreground">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                  <Button onClick={handleApplySuggestion} disabled={moveCandidateMutation.isPending}>
                    {moveCandidateMutation.isPending ? 'Moving...' : 'Apply Suggestion'}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{suggestion.reasoning}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No suggestion available.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}