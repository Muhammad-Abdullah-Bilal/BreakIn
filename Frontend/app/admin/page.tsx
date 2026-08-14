'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShieldCheck, 
  Sliders, 
  Bot, 
  BarChart3, 
  Users, 
  Lock, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Trash2,
  Save,
  Plus
} from 'lucide-react';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all');

  // Feature Flags State
  const [flags, setFlags] = useState([
    { id: 'flag-1', name: 'AI Code Evaluator GPT-5', description: 'Enable autonomous code grading and rubric generation', enabled: true, category: 'AI Services' },
    { id: 'flag-2', name: 'Squad Hiring Protocol', description: 'Allow corporate sponsors to hire entire bonded developer squads', enabled: true, category: 'Hiring' },
    { id: 'flag-3', name: '3D Interactive Talent Globe', description: 'Display live WebGL globe on marketing landing pages', enabled: true, category: 'Frontend' },
    { id: 'flag-4', name: 'Automated Outreach Agent', description: 'Permit background agents to send automated match emails', enabled: false, category: 'Recruitment' },
    { id: 'flag-5', name: 'Anonymous Pseudonym Rotation', description: 'Rotate developer pseudonyms per simulation sprint', enabled: true, category: 'Security' },
  ]);

  // Moderation Queue State
  const [reports, setReports] = useState([
    { id: 'rep-1', user: 'QuantumFalcon', reportedBy: 'Mentor_Sarah', reason: 'Suspected code plagiarism in Sprint #104', date: '10 mins ago', status: 'Pending' },
    { id: 'rep-2', user: 'CyberWolf99', reportedBy: 'System AI Audit', reason: 'Automated test suite bypass attempt', date: '1 hour ago', status: 'Pending' },
    { id: 'rep-3', user: 'ApexBuilder', reportedBy: 'Dev_Elena', reason: 'Unsportsmanlike feedback in squad chat', date: '3 hours ago', status: 'Resolved' },
  ]);

  // Audit Logs State
  const [logs, setLogs] = useState([
    { id: 'log-1', action: 'ROLE_CHANGE', actor: 'super_admin', target: 'user_alex@breakin.io', details: 'Promoted to Mentor', timestamp: '2026-08-12 11:20:04' },
    { id: 'log-2', action: 'FEATURE_TOGGLE', actor: 'super_admin', target: 'AI Code Evaluator', details: 'Status switched to ENABLED', timestamp: '2026-08-12 10:45:12' },
    { id: 'log-3', action: 'SECURITY_ALERT', actor: 'system_guard', target: '192.168.1.104', details: 'Rate limit threshold exceeded (429)', timestamp: '2026-08-12 09:15:33' },
    { id: 'log-4', action: 'COMPANY_VERIFICATION', actor: 'admin_moderator', target: 'TechCorp International', details: 'Approved employer tier', timestamp: '2026-08-12 08:30:19' },
  ]);

  // Platform Settings State
  const [settings, setSettings] = useState({
    platformName: 'BreakIn Direct',
    sprintPassingScore: '85',
    maxSquadSize: '5',
    requireMentorReview: true,
    enableSelfRegistration: true,
    maintenanceMode: false,
  });

  const toggleFlag = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const resolveReport = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
  };

  const dismissReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-7 h-7 text-red-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Administrator Console</h1>
                <Badge className="bg-red-950/80 border-red-800 text-red-300 text-xs px-2 py-0.5">Admin Security</Badge>
              </div>
              <p className="text-sm text-slate-400">
                Centralized management for system policies, feature flags, moderation queues, and security logs.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-900 border-slate-800 text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Core Online
              </Badge>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Active Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{flags.filter(f => f.enabled).length} / {flags.length}</div>
                <p className="text-[11px] text-blue-400">Operational</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Pending Moderations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-400">{reports.filter(r => r.status === 'Pending').length}</div>
                <p className="text-[11px] text-amber-400/80">Requires Review</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{logs.length}</div>
                <p className="text-[11px] text-emerald-400">Zero Critical Incidents</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Platform Threshold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{settings.sprintPassingScore}%</div>
                <p className="text-[11px] text-slate-400">Rubric Benchmark</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-950/80 border border-slate-800 p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm"
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                Global Settings
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                Moderation
              </TabsTrigger>
              <TabsTrigger
                value="flags"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                Feature Flags
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Global Settings */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">System Configuration & Policies</CardTitle>
                  <CardDescription className="text-slate-400">
                    Adjust simulation scoring criteria, team constraints, and global system thresholds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platformName" className="text-slate-300">Platform Brand Title</Label>
                      <Input
                        id="platformName"
                        value={settings.platformName}
                        onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingScore" className="text-slate-300">Minimum Sprint Passing Score (%)</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        value={settings.sprintPassingScore}
                        onChange={(e) => setSettings({ ...settings, sprintPassingScore: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="squadSize" className="text-slate-300">Max Developers per Squad</Label>
                      <Input
                        id="squadSize"
                        type="number"
                        value={settings.maxSquadSize}
                        onChange={(e) => setSettings({ ...settings, maxSquadSize: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-white">Require Senior Mentor Review</p>
                        <p className="text-xs text-slate-400">AI evaluation requires mentor approval before portfolio badge</p>
                      </div>
                      <Switch
                        checked={settings.requireMentorReview}
                        onCheckedChange={(checked) => setSettings({ ...settings, requireMentorReview: checked })}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
                  <Button className="bg-red-600 hover:bg-red-500 text-white gap-2 text-xs">
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab 2: Moderation Queue */}
            <TabsContent value="moderation" className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg text-white">User & Submission Moderation</CardTitle>
                    <CardDescription className="text-slate-400">
                      Review integrity violations, code plagiarism flags, and conduct reports.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {reports.length} Total Reports
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400">Reported User</TableHead>
                        <TableHead className="text-slate-400">Reported By</TableHead>
                        <TableHead className="text-slate-400">Violation Reason</TableHead>
                        <TableHead className="text-slate-400">Time</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} className="border-slate-800/60 hover:bg-slate-800/30">
                          <TableCell className="font-medium text-white">{report.user}</TableCell>
                          <TableCell className="text-slate-300 text-xs">{report.reportedBy}</TableCell>
                          <TableCell className="text-slate-300 text-xs">{report.reason}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{report.date}</TableCell>
                          <TableCell>
                            <Badge className={report.status === 'Resolved' ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-amber-950 border-amber-800 text-amber-300'}>
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {report.status === 'Pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveReport(report.id)}
                                className="h-7 text-xs border-emerald-700 hover:bg-emerald-900/40 text-emerald-300"
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissReport(report.id)}
                              className="h-7 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Feature Flags */}
            <TabsContent value="flags" className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Dynamic Feature Toggles</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enable or disable specific system modules instantly without redeploying code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flags.map((flag) => (
                      <div key={flag.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{flag.name}</span>
                            <Badge variant="outline" className="text-[10px] bg-slate-900 border-slate-700 text-slate-300">
                              {flag.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{flag.description}</p>
                        </div>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={() => toggleFlag(flag.id)}
                          className="data-[state=checked]:bg-red-600"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Audit Logs */}
            <TabsContent value="logs" className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg text-white">Security & Activity Audit Trail</CardTitle>
                    <CardDescription className="text-slate-400">
                      Immutable record of privileged operations and security events.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-xs text-slate-300 gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400">Timestamp</TableHead>
                        <TableHead className="text-slate-400">Action</TableHead>
                        <TableHead className="text-slate-400">Actor</TableHead>
                        <TableHead className="text-slate-400">Target</TableHead>
                        <TableHead className="text-slate-400">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="border-slate-800/60 hover:bg-slate-800/30">
                          <TableCell className="font-mono text-xs text-slate-400">{log.timestamp}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-red-800/50 text-red-400 bg-red-950/30 text-[10px]">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-200 text-xs font-medium">{log.actor}</TableCell>
                          <TableCell className="text-slate-300 text-xs">{log.target}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}
