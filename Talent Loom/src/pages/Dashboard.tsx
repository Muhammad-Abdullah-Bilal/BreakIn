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
  AlertCircle,
  Radar,
  Activity,
  Eye,
  Settings as SettingsIcon
} from "lucide-react";
import { useDashboard, usePipeline, useJobs, useDashboardNarrative, useAgentStatus, useAgentActivity } from "@/hooks/useApi";
import { usePipelineSubscription, useJobsSubscription } from "@/hooks/useRealtime";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  // Use real API hooks
  const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useDashboard();
  const { data: agentStatus, isLoading: agentStatusLoading } = useAgentStatus();
  const { data: recentActivity, isLoading: activityLoading } = useAgentActivity();
  
  // Subscribe to realtime updates
  usePipelineSubscription();
  useJobsSubscription();

  // Fallback data for when API is not available
  const mockKpiData = {
    activeJobs: 8,
    pipeline: 23,
    radarDetections: 47,
    successRate: 94
  };

  const displayKpiData = kpiData || mockKpiData;
  const displayAgentStatus = agentStatus || [
    { name: "Job Radar Agent", description: "Scanning job boards", status: "Active" },
    { name: "Talent Matching", description: "Processing matches", status: "Active" },
    { name: "Outreach Agent", description: "Standby mode", status: "Idle" }
  ];
  const displayActivity = recentActivity || [
    { title: "New job detected: Senior React Developer at TechCorp", time: "2 hours ago", type: "detection" },
    { title: "Outreach sent for Full Stack Engineer role", time: "4 hours ago", type: "outreach" },
    { title: "High match found for DevOps Engineer", time: "6 hours ago", type: "match" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TalentLoom Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered talent acquisition and pipeline management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Radar Active
          </Badge>
          <div className="w-8 h-4 bg-primary rounded-full relative">
            <div className="w-4 h-4 bg-white rounded-full absolute right-0 top-0 shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* KPI Cards - matching the design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{displayKpiData.activeJobs}</div>
            <p className="text-xs text-primary">+2 this week</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{displayKpiData.pipeline || displayKpiData.totalCandidates}</div>
            <p className="text-xs text-primary">Candidates active</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Radar Detections</CardTitle>
            <Radar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{displayKpiData.radarDetections || displayKpiData.hiredThisMonth}</div>
            <p className="text-xs text-primary">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{displayKpiData.successRate || displayKpiData.conversionRate}%</div>
            <p className="text-xs text-primary">Above average</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Status - matching the design */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary" />
            AI Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {agentStatusLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-secondary/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
              ))
            ) : (
              displayAgentStatus.map((agent, index) => (
                <div key={index} className="bg-secondary/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{agent.name}</h4>
                    <Badge 
                      variant={agent.status === "Active" ? "default" : "secondary"}
                      className={agent.status === "Active" ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Radar Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Radar Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="w-2 h-2 rounded-full mt-2" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : (
              displayActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'detection' ? 'bg-primary' : 
                    activity.type === 'outreach' ? 'bg-blue-500' : 'bg-warning'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link to="/jobs">
                <Plus className="w-4 h-4 mr-2" />
                Create Job Posting
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary" asChild>
              <Link to="/candidates">
                <Search className="w-4 h-4 mr-2" />
                Search Candidates
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary" asChild>
              <Link to="/settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure Settings
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary" asChild>
              <Link to="/reports">
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}