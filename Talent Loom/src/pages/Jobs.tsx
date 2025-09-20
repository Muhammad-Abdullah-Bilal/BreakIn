import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Users, 
  MapPin, 
  DollarSign,
  Calendar,
  TrendingUp,
  Pause,
  Play
} from "lucide-react";
import { mockJobPostings } from "@/lib/mockData";
import { JobPosting } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Jobs() {
  const [jobs, setJobs] = useState(mockJobPostings);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  const handleStatusChange = (jobId: string, newStatus: JobPosting['status']) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  const getStatusColor = (status: JobPosting['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'closed': return 'outline';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const JobCard = ({ job }: { job: JobPosting }) => {
    const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {job.companyName}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(job.status)}>
                {job.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingJob(job)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {job.status === 'active' ? (
                    <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'paused')}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'active')}>
                      <Play className="w-4 h-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 3} more
              </Badge>
            )}
          </div>

          {/* Job Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{job.location} {job.remote && "• Remote"}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {job.experienceLevel}
              </Badge>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              <span>
                ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>{job.applicationsCount} applications</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{job.viewsCount} views</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{daysAgo}d ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CreateJobDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Job Posting</DialogTitle>
          <DialogDescription>
            Fill in the details for your new job posting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="e.g. Senior Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track">Track</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend Development</SelectItem>
                  <SelectItem value="backend">Backend Development</SelectItem>
                  <SelectItem value="fullstack">Full Stack Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead/Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. San Francisco, CA" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minSalary">Min Salary</Label>
              <Input id="minSalary" type="number" placeholder="120000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSalary">Max Salary</Label>
              <Input id="maxSalary" type="number" placeholder="160000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills (comma-separated)</Label>
            <Input id="skills" placeholder="React, TypeScript, Node.js, GraphQL" />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button>Create Job Posting</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Postings</h1>
          <p className="text-muted-foreground">
            Manage your active job postings and create new opportunities
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'active').length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
            <div className="text-2xl font-bold">{jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <div className="text-2xl font-bold">{jobs.reduce((sum, job) => sum + job.viewsCount, 0)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Applications</CardTitle>
            <div className="text-2xl font-bold">{Math.round(jobs.reduce((sum, job) => sum + job.applicationsCount, 0) / jobs.length)}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Job Listings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      <CreateJobDialog />
    </div>
  );
}