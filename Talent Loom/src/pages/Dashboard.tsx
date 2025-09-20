import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  BriefcaseIcon, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target,
  Search,
  Plus,
  AlertCircle
} from "lucide-react";
import { useDashboard, usePipeline, useJobs, useDashboardNarrative } from "@/hooks/useApi";
import { usePipelineSubscription, useJobsSubscription } from "@/hooks/useRealtime";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useDashboard();
  const { data: narrativeData, isLoading: narrativeLoading } = useDashboardNarrative();
  const { data: pipelineData, isLoading: pipelineLoading } = usePipeline();
  const { data: jobsData, isLoading: jobsLoading } = useJobs();

  // Subscribe to realtime updates
  usePipelineSubscription();
  useJobsSubscription();

  const recentMatches = pipelineData?.slice(0, 3) || [];
  const activeJobs = jobsData?.filter(job => job.status === 'active').slice(0, 3) || [];

  if (kpiError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kpiCards = kpiData ? [
    {
      title: "Total Candidates",
      value: kpiData.totalCandidates.toLocaleString(),
      description: "Active in talent pool",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Jobs",
      value: kpiData.activeJobs.toString(),
      description: "Currently hiring",
      icon: BriefcaseIcon,
      color: "text-success"
    },
    {
      title: "Pending Offers",
      value: kpiData.pendingOffers.toString(),
      description: "Awaiting response",
      icon: FileText,
      color: "text-warning"
    },
    {
      title: "Hired This Month",
      value: kpiData.hiredThisMonth.toString(),
      description: "Successful placements",
      icon: TrendingUp,
      color: "text-success"
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recruiting Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to TalentLoom. Monitor your hiring performance and key metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/candidates">
              <Search className="w-4 h-4 mr-2" />
              Find Candidates
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/jobs">
              <Plus className="w-4 h-4 mr-2" />
              Post Job
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI-Powered Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Intelligent analysis of your hiring performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Narrative */}
            {narrativeLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : narrativeData ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <p className="text-sm leading-relaxed text-foreground">
                  {narrativeData}
                </p>
              </div>
            ) : null}

            {kpiLoading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-20" />
                    ))}
                  </div>
                </div>
              </div>
            ) : kpiData ? (
              <>
                {/* Average Time to Hire */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Time to Hire</span>
                    <span className="text-sm text-muted-foreground">{kpiData.averageTimeToHire} days</span>
                  </div>
                  <Progress value={Math.min((30 - kpiData.averageTimeToHire) / 30 * 100, 100)} className="h-2" />
                </div>

                {/* Conversion Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm text-muted-foreground">{kpiData.conversionRate}%</span>
                  </div>
                  <Progress value={kpiData.conversionRate} className="h-2" />
                </div>

                {/* Top Skills */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Most In-Demand Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {kpiData.topSkills.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill.skill} ({skill.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common recruiting tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/candidates">
                <Search className="w-4 h-4 mr-2" />
                Search Candidates
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/jobs">
                <Plus className="w-4 h-4 mr-2" />
                Create Job Posting
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/pipeline">
                <Users className="w-4 h-4 mr-2" />
                Manage Pipeline
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/reports">
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Matches
              <Button asChild variant="ghost" size="sm">
                <Link to="/matches">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Latest candidate-job matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))
            ) : (
              recentMatches.map((match) => (
                <div key={match.id} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={match.candidate.avatar} />
                    <AvatarFallback>
                      {match.candidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{match.candidate.name}</p>
                    <p className="text-xs text-muted-foreground">{match.jobTitle}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {match.matchScore && (
                      <Badge variant="secondary" className="text-xs">
                        {match.matchScore}% match
                      </Badge>
                    )}
                    <Badge variant={
                      match.stage === 'offer' ? 'default' : 
                      match.stage === 'interview' ? 'secondary' : 'outline'
                    }>
                      {match.stage}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Jobs
              <Button asChild variant="ghost" size="sm">
                <Link to="/jobs">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Currently open positions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                  <Skeleton className="h-1 w-full" />
                </div>
              ))
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{job.title}</h4>
                    <Badge variant="outline">{job.experienceLevel}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{job.companyName}</span>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {job.applicationsCount}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    </div>
                  </div>
                  <Progress value={(job.applicationsCount / 50) * 100} className="h-1" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}