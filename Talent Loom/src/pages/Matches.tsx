import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Target, 
  Star, 
  MapPin, 
  TrendingUp,
  Plus,
  Eye,
  Zap,
  Brain,
  AlertCircle
} from "lucide-react";
import { useMatches, useCandidates, useJobs, useAddToPipeline, useMatchExplanation, useRefreshMatchIndex } from "@/hooks/useApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Matches() {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<{ candidateId: string; jobId: string } | null>(null);
  
  const { data: matches, isLoading: matchesLoading, error } = useMatches();
  const { data: candidates } = useCandidates();
  const { data: jobs } = useJobs();
  const addToPipelineMutation = useAddToPipeline();
  const refreshIndexMutation = useRefreshMatchIndex();
  
  // Get AI explanation for selected match
  const { data: explanation, isLoading: explanationLoading } = useMatchExplanation(
    selectedMatch?.candidateId || '',
    selectedMatch?.jobId || ''
  );

  // Combine match data with candidate and job info
  const enrichedMatches = (matches || []).map(match => {
    const candidate = candidates?.find(c => c.id === match.candidateId);
    const job = jobs?.find(j => j.id === match.jobId);
    return { ...match, candidate, job };
  }).filter(match => match.candidate && match.job);

  // Filter matches by selected job
  const filteredMatches = selectedJobId === 'all' 
    ? enrichedMatches 
    : enrichedMatches.filter(match => match.jobId === selectedJobId);

  const handleAddToPipeline = (candidateId: string, jobId: string) => {
    addToPipelineMutation.mutate({ candidateId, jobId });
  };

  const handleRefreshIndex = () => {
    refreshIndexMutation.mutate();
  };

  const handleViewExplanation = (candidateId: string, jobId: string) => {
    setSelectedMatch({ candidateId, jobId });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load matches data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }



  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    return "outline";
  };

  const MatchCard = ({ match }: { match: typeof enrichedMatches[0] }) => {
    const { candidate, job } = match;
    if (!candidate || !job) return null;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={candidate.avatar} />
                <AvatarFallback>
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{candidate.name}</CardTitle>
                <CardDescription className="text-sm">
                  {candidate.track} • {candidate.experience}
                </CardDescription>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{candidate.location}</span>
                  <div className="flex items-center ml-4">
                    <Star className="w-3 h-3 mr-1 fill-warning text-warning" />
                    <span>{candidate.reputation}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant={getScoreBadgeVariant(match.score)} className="text-sm">
              <Target className="w-3 h-3 mr-1" />
              {match.score}% match
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Job Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{job.title}</h4>
              <Badge variant="outline" className="text-xs">
                {job.companyName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          </div>

          {/* Match Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Brain className="w-3 h-3 mr-2 text-blue-500" />
                Skills Match
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={match.skillsMatch} className="w-16 h-2" />
                <span className="text-xs font-medium w-8">{match.skillsMatch}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-2 text-green-500" />
                Experience Match
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={match.experienceMatch} className="w-16 h-2" />
                <span className="text-xs font-medium w-8">{match.experienceMatch}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Zap className="w-3 h-3 mr-2 text-yellow-500" />
                Availability Match
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={match.availabilityMatch} className="w-16 h-2" />
                <span className="text-xs font-medium w-8">{match.availabilityMatch}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-2 text-purple-500" />
                Location Match
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={match.locationMatch} className="w-16 h-2" />
                <span className="text-xs font-medium w-8">{match.locationMatch}%</span>
              </div>
            </div>
          </div>

          {/* Why Matched */}
          <div className="bg-accent/30 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-accent-foreground mb-2">Why this is a great match:</h5>
            <ul className="space-y-1">
              {match.reasons.map((reason, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Skills Overlap */}
          <div>
            <h5 className="text-xs font-semibold mb-2">Matching Skills:</h5>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.filter(skill => 
                job.skills.some(jobSkill => 
                  jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
                  skill.toLowerCase().includes(jobSkill.toLowerCase())
                )
              ).slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleAddToPipeline(candidate.id, job.id)}
              disabled={addToPipelineMutation.isPending}
            >
              <Plus className="w-3 h-3 mr-1" />
              {addToPipelineMutation.isPending ? 'Adding...' : 'Add to Pipeline'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleViewExplanation(candidate.id, job.id)}
            >
              <Brain className="w-3 h-3 mr-1" />
              AI Explain
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Matching</h1>
          <p className="text-muted-foreground">
            AI-powered candidate matching with detailed compatibility analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs?.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefreshIndex}
            disabled={refreshIndexMutation.isPending}
          >
            <Brain className="w-4 h-4 mr-2" />
            {refreshIndexMutation.isPending ? 'Refreshing...' : 'Refresh AI Index'}
          </Button>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
            <div className="text-2xl font-bold">{filteredMatches.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Quality (90%+)</CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {filteredMatches.filter(m => m.score >= 90).length}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Good Matches (80%+)</CardTitle>
            <div className="text-2xl font-bold text-blue-600">
              {filteredMatches.filter(m => m.score >= 80).length}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <div className="text-2xl font-bold">
              {filteredMatches.length > 0 ? Math.round(filteredMatches.reduce((sum, m) => sum + m.score, 0) / filteredMatches.length) : 0}%
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Matches</CardTitle>
          <CardDescription>Refine your matches based on specific criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select defaultValue="score">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sort by Match Score</SelectItem>
                <SelectItem value="skills">Sort by Skills Match</SelectItem>
                <SelectItem value="experience">Sort by Experience Match</SelectItem>
                <SelectItem value="availability">Sort by Availability</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="90">90%+ matches</SelectItem>
                <SelectItem value="80">80%+ matches</SelectItem>
                <SelectItem value="70">70%+ matches</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedMatch && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedMatch(null)}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        {matchesLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="w-16 h-2" />
                        <Skeleton className="w-8 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-16" />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredMatches
            .sort((a, b) => b.score - a.score)
            .map((match) => (
              <MatchCard key={`${match.candidateId}-${match.jobId}`} match={match} />
            ))
        )}
      </div>

      {/* AI Explanation Modal */}
      {selectedMatch && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Match Explanation
            </CardTitle>
            <CardDescription>
              Detailed analysis of why this candidate matches the job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {explanationLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : explanation ? (
              <p className="text-sm leading-relaxed">{explanation}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No explanation available.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}