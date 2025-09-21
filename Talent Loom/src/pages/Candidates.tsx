import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  DollarSign,
  Plus,
  Eye,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { useCandidates, useCandidateSearch, useAddToPipeline } from "@/hooks/useApi";
import { mockMatchScores } from "@/lib/mockData";
import { Candidate, CandidateFilters } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Candidates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<CandidateFilters>>({
    skills: [],
    experienceLevel: [],
    availability: []
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Use search query if it's long enough, otherwise get all candidates
  const { data: searchResults, isLoading: searchLoading } = useCandidateSearch(searchQuery);
  const { data: allCandidates, isLoading: candidatesLoading, error } = useCandidates(filters);
  const addToPipelineMutation = useAddToPipeline();

  const candidates = useMemo(() => {
    if (searchQuery.length > 2) {
      return searchResults || [];
    }
    return allCandidates || [];
  }, [searchQuery, searchResults, allCandidates]);

  const isLoading = searchQuery.length > 2 ? searchLoading : candidatesLoading;

  const handleShortlist = (candidateId: string) => {
    // For demo purposes, add to first available job
    addToPipelineMutation.mutate({ candidateId, jobId: '1' });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load candidates. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
    const matchScore = mockMatchScores.find(m => m.candidateId === candidate.id);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => setSelectedCandidate(candidate)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={candidate.avatar} />
                <AvatarFallback>
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base font-semibold">{candidate.name}</CardTitle>
                <CardDescription className="text-sm">{candidate.track}</CardDescription>
              </div>
            </div>
            {matchScore && (
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                {matchScore.score}% match
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Skills */}
          <div>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1 fill-warning text-warning" />
                <span>{candidate.reputation}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{candidate.location}</span>
              </div>
            </div>
            <Badge variant={
              candidate.availability === 'available' ? 'default' :
              candidate.availability === 'busy' ? 'secondary' : 'outline'
            } className="text-xs">
              {candidate.availability}
            </Badge>
          </div>

          {/* Salary Expectation */}
          {candidate.salaryExpectation && (
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="w-3 h-3 mr-1" />
              <span>
                ${candidate.salaryExpectation.min.toLocaleString()} - 
                ${candidate.salaryExpectation.max.toLocaleString()} {candidate.salaryExpectation.currency}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleShortlist(candidate.id);
              }}
              disabled={addToPipelineMutation.isPending}
            >
              <Plus className="w-3 h-3 mr-1" />
              {addToPipelineMutation.isPending ? 'Adding...' : 'Shortlist'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCandidate(candidate);
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
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
          <h1 className="text-3xl font-bold">Talent Discovery</h1>
          <p className="text-muted-foreground">
            Search and discover top candidates using AI-powered matching
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates by name, skills, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Candidates</SheetTitle>
                  <SheetDescription>
                    Refine your search with specific criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium">Experience Level</label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead/Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Track</label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frontend">Frontend Development</SelectItem>
                        <SelectItem value="backend">Backend Development</SelectItem>
                        <SelectItem value="fullstack">Full Stack Development</SelectItem>
                        <SelectItem value="mobile">Mobile Development</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Availability</label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `Found ${candidates.length} candidates`}
          </p>
          <Select defaultValue="match">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="reputation">Highest Rated</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-16" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))
          )}
        </div>
      </div>

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="sm:max-w-xl">
          {selectedCandidate && (
            <>
              <SheetHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedCandidate.avatar} />
                    <AvatarFallback>
                      {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selectedCandidate.name}</SheetTitle>
                    <SheetDescription className="text-base">
                      {selectedCandidate.track} • {selectedCandidate.experience}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{selectedCandidate.reputation}</div>
                    <div className="text-xs text-muted-foreground">Reputation</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{selectedCandidate.skills.length}</div>
                    <div className="text-xs text-muted-foreground">Skills</div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.bio}</p>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-semibold mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location & Availability */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedCandidate.location}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Availability</h4>
                    <Badge variant={
                      selectedCandidate.availability === 'available' ? 'default' :
                      selectedCandidate.availability === 'busy' ? 'secondary' : 'outline'
                    }>
                      {selectedCandidate.availability}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Pipeline
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}