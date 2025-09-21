import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  FileSpreadsheet, 
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useDashboard, usePipeline, useOffers, useAsyncExport, useExportStatus } from "@/hooks/useApi";
import { useReportsSubscription } from "@/hooks/useRealtime";
import { reportsApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);

  const { data: kpiData, isLoading: kpiLoading, error } = useDashboard();
  const { data: pipelineData } = usePipeline();
  const { data: offersData } = useOffers();
  const asyncExportMutation = useAsyncExport();
  
  // Subscribe to report updates
  useReportsSubscription();
  
  // Monitor export status
  const { data: exportStatus } = useExportStatus(exportJobId || '');

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load reports data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mock report data
  const reportData = [
    {
      id: 1,
      date: "2024-03-15",
      jobTitle: "Senior Frontend Developer",
      candidate: "Sarah Chen",
      stage: "Hired",
      timeToHire: 18,
      salary: 140000,
      source: "Direct Application"
    },
    {
      id: 2,
      date: "2024-03-14",
      jobTitle: "Backend Engineer",
      candidate: "Marcus Johnson",
      stage: "Interview",
      timeToHire: 12,
      salary: 125000,
      source: "Referral"
    },
    {
      id: 3,
      date: "2024-03-13",
      jobTitle: "Full Stack Developer",
      candidate: "Elena Rodriguez",
      stage: "Offer",
      timeToHire: 15,
      salary: 150000,
      source: "Talent Pool"
    },
    {
      id: 4,
      date: "2024-03-12",
      jobTitle: "Senior Frontend Developer",
      candidate: "Alex Kim",
      stage: "Rejected",
      timeToHire: 8,
      salary: 0,
      source: "Job Board"
    },
    {
      id: 5,
      date: "2024-03-11",
      jobTitle: "DevOps Engineer",
      candidate: "Jordan Smith",
      stage: "Hired",
      timeToHire: 22,
      salary: 135000,
      source: "Headhunter"
    }
  ];

  const handleExportCSV = async () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    // Try async export first
    try {
      const result = await asyncExportMutation.mutateAsync({ 
        type: 'csv', 
        params: { data: reportData, dateRange, selectedReport } 
      });
      setExportJobId(result.jobId);
    } catch (error) {
      // Fallback to sync export
      setIsExporting(true);
      try {
        const csvContent = await reportsApi.exportCSV(reportData);
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hiring-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("CSV exported successfully!");
      } catch (syncError) {
        toast.error("Failed to export CSV");
        console.error("CSV export error:", syncError);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleExportPDF = async () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    // Try async export first
    try {
      const result = await asyncExportMutation.mutateAsync({ 
        type: 'pdf', 
        params: { data: reportData, dateRange, selectedReport } 
      });
      setExportJobId(result.jobId);
    } catch (error) {
      // Fallback to sync export
      setIsExporting(true);
      try {
        const pdfBlob = await reportsApi.exportPDF(reportData);
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hiring-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("PDF exported successfully!");
      } catch (syncError) {
        toast.error("Failed to export PDF");
        console.error("PDF export error:", syncError);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'hired': return 'default';
      case 'offer': return 'secondary';
      case 'interview': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive hiring analytics with exportable reports and KPIs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={isExporting || kpiLoading || asyncExportMutation.isPending}
          >
            {(isExporting || asyncExportMutation.isPending) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting || kpiLoading || asyncExportMutation.isPending}
          >
            {(isExporting || asyncExportMutation.isPending) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
          
          {exportJobId && exportStatus && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Export Status:</span>
              <Badge variant={exportStatus.status === 'completed' ? 'default' : 'secondary'}>
                {exportStatus.status}
              </Badge>
              {exportStatus.downloadUrl && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(exportStatus.downloadUrl, '_blank')}
                >
                  Download
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
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
        ) : kpiData ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.averageTimeToHire} days</div>
                <p className="text-xs text-muted-foreground">Average across all positions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Application to hire ratio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.hiredThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.totalCandidates}</div>
                <p className="text-xs text-muted-foreground">Candidates in process</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Hiring Funnel Analysis
          </CardTitle>
          <CardDescription>
            Track candidate progression through your hiring stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kpiLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="w-24 h-4" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="flex-1 h-2" />
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-12 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : kpiData ? (
            <div className="space-y-4">
              {kpiData.hiringFunnel.map((stage, index) => {
                const percentage = (stage.count / kpiData.hiringFunnel[0].count) * 100;
                return (
                  <div key={stage.stage} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium w-16">{stage.count}</div>
                        <div className="text-xs text-muted-foreground w-12">
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Filters and Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Customize your reports with specific date ranges and criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Hiring Overview</SelectItem>
                <SelectItem value="pipeline">Pipeline Analysis</SelectItem>
                <SelectItem value="performance">Recruiter Performance</SelectItem>
                <SelectItem value="sources">Source Effectiveness</SelectItem>
                <SelectItem value="salary">Salary Analysis</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="frontend">Frontend Roles</SelectItem>
                <SelectItem value="backend">Backend Roles</SelectItem>
                <SelectItem value="fullstack">Full Stack Roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Hiring Data</CardTitle>
          <CardDescription>
            Comprehensive view of all hiring activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Time to Hire</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{row.jobTitle}</TableCell>
                  <TableCell>{row.candidate}</TableCell>
                  <TableCell>
                    <Badge variant={getStageColor(row.stage)}>
                      {row.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.timeToHire} days</TableCell>
                  <TableCell>
                    {row.salary > 0 ? (
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {row.salary.toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {row.source}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Skills Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Most In-Demand Skills</CardTitle>
          <CardDescription>
            Skills that appear most frequently in successful hires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kpiLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="w-20 h-4" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="flex-1 h-2" />
                      <Skeleton className="w-12 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : kpiData ? (
            <div className="space-y-4">
              {kpiData.topSkills.map((skill, index) => {
                const percentage = (skill.count / kpiData.topSkills[0].count) * 100;
                return (
                  <div key={skill.skill} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{skill.skill}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium w-12">{skill.count}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}