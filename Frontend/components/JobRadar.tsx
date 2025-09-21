"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  ExternalLink,
  Radar,
  Settings,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Eye,
  Zap
} from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  skills: string[]
  salary_min?: number
  salary_max?: number
  job_type: string
  experience_level: string
  platform: string
  url: string
  is_active: boolean
  scraped_at: string
}

interface JobSearchFilters {
  keywords?: string
  location?: string
  company?: string
  job_type?: string
  experience_level?: string
  platform?: string
  skills?: string[]
  posted_within_days?: number
}

interface JobSearchResponse {
  jobs: Job[]
  total_count: number
  page: number
  page_size: number
  filters_applied: JobSearchFilters
}

interface ScrapingStatus {
  is_enabled: boolean
  last_scraping?: string
  next_scraping?: string
  platforms_status: Record<string, any>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function JobRadar() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null)
  
  // Search and filter states
  const [searchKeywords, setSearchKeywords] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('all')
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [postedWithinDays, setPostedWithinDays] = useState(30)
  
  // Configuration states
  const [radarConfig, setRadarConfig] = useState({
    keywords: '',
    platforms: {
      linkedin: true,
      indeed: true,
      stackoverflow: true,
      angellist: true,
      company_careers: true
    },
    autoOutreach: false
  })

  const platforms = [
    { name: 'linkedin', display_name: 'LinkedIn Jobs' },
    { name: 'indeed', display_name: 'Indeed' },
    { name: 'stackoverflow', display_name: 'Stack Overflow Jobs' },
    { name: 'angellist', display_name: 'AngelList' },
    { name: 'company_careers', display_name: 'Company Career Pages' }
  ]

  // Fetch jobs from API
  const fetchJobs = async (page = 1, retries = 3) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
        posted_within_days: postedWithinDays.toString()
      })
      
      if (searchKeywords) params.append('keywords', searchKeywords)
      if (locationFilter) params.append('location', locationFilter)
      if (companyFilter) params.append('company', companyFilter)
      if (jobTypeFilter && jobTypeFilter !== 'all') params.append('job_type', jobTypeFilter)
      if (experienceLevelFilter && experienceLevelFilter !== 'all') params.append('experience_level', experienceLevelFilter)
      if (platformFilter && platformFilter !== 'all') params.append('platform', platformFilter)
      
      const url = `${API_BASE_URL}/api/jobs/search?${params}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      
      const data: JobSearchResponse = await response.json()
      setJobs(data.jobs)
      setTotalCount(data.total_count)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs'
      console.error('Error fetching jobs:', err)
      
      if (retries > 0 && errorMessage.includes('Failed to fetch')) {
        console.log(`Retrying job fetch... (${retries} attempts left)`)
        setTimeout(() => fetchJobs(page, retries - 1), 2000)
        return
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fetch scraping status
  const fetchScrapingStatus = async (retries = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/scraping/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setScrapingStatus(data)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error fetching scraping status:', err)
      if (retries > 0) {
        console.log(`Retrying scraping status fetch... (${retries} attempts left)`)
        setTimeout(() => fetchScrapingStatus(retries - 1), 2000)
      }
    }
  }

  // Trigger job scraping
  const triggerScraping = async () => {
    try {
      const enabledPlatforms = Object.entries(radarConfig.platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform, _]) => platform)
      
      const response = await fetch(`${API_BASE_URL}/api/jobs/scraping/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platforms: enabledPlatforms
        })
      })
      
      if (response.ok) {
        alert('Job scraping triggered successfully!')
        fetchScrapingStatus()
      } else {
        throw new Error('Failed to trigger scraping')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger scraping')
    }
  }

  // Format salary range
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Salary not specified'
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  useEffect(() => {
    // Add a small delay to ensure component is fully mounted and backend is ready
    const timer = setTimeout(() => {
      fetchJobs()
      fetchScrapingStatus()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/40 border-white/10">
          <TabsTrigger value="jobs" className="text-white data-[state=active]:bg-blue-600">
            Job Listings
          </TabsTrigger>
          <TabsTrigger value="config" className="text-white data-[state=active]:bg-blue-600">
            Configuration
          </TabsTrigger>
          <TabsTrigger value="status" className="text-white data-[state=active]:bg-blue-600">
            Status
          </TabsTrigger>
        </TabsList>

        {/* Job Listings Tab */}
        <TabsContent value="jobs" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-400" />
                Search & Filter Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Keywords</Label>
                  <Input
                    placeholder="React, Python, DevOps..."
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder-gray-400 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Location</Label>
                  <Input
                    placeholder="San Francisco, Remote..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder-gray-400 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Company</Label>
                  <Input
                    placeholder="Google, Microsoft..."
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder-gray-400 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Job Type</Label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger className="bg-black/60 border-white/10 text-white mt-1">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Experience Level</Label>
                  <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
                    <SelectTrigger className="bg-black/60 border-white/10 text-white mt-1">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead/Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Platform</Label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="bg-black/60 border-white/10 text-white mt-1">
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.name} value={platform.name}>
                          {platform.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-gray-300">Posted within:</Label>
                  <Select value={postedWithinDays.toString()} onValueChange={(value) => setPostedWithinDays(parseInt(value))}>
                    <SelectTrigger className="bg-black/60 border-white/10 text-white w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => fetchJobs(1)} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search Jobs'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-900/20 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">{error}</span>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-400">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Results */}
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Job Listings ({totalCount} found)
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchJobs(currentPage)}
                  disabled={loading}
                  className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && jobs.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-4" />
                  <p className="text-gray-400">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No jobs found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-1">{job.title}</h3>
                          <div className="flex items-center space-x-4 text-gray-400 text-sm mb-2">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {job.company}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(job.scraped_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-600 text-white">
                            {platforms.find(p => p.name === job.platform)?.display_name || job.platform}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent"
                            onClick={() => window.open(job.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Job
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {job.description.substring(0, 200)}...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} className="bg-gray-700 text-gray-300 text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge className="bg-gray-600 text-gray-400 text-xs">
                              +{job.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center text-green-400">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </div>
                          <Badge className={`${
                            job.job_type === 'full-time' ? 'bg-green-600' :
                            job.job_type === 'part-time' ? 'bg-yellow-600' :
                            job.job_type === 'contract' ? 'bg-blue-600' : 'bg-purple-600'
                          } text-white text-xs`}>
                            {job.job_type}
                          </Badge>
                          <Badge className="bg-orange-600 text-white text-xs">
                            {job.experience_level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {totalCount > 20 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-gray-400 text-sm">
                    Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} jobs
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchJobs(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchJobs(currentPage + 1)}
                      disabled={currentPage * 20 >= totalCount || loading}
                      className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-400" />
                Radar Configuration
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure your AI job radar settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-300 text-base font-medium">Target Job Sources</Label>
                  <p className="text-gray-400 text-sm mb-4">Select which platforms to monitor for new job postings</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platforms.map((platform) => (
                      <div key={platform.name} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{platform.display_name}</p>
                          <p className="text-gray-400 text-sm">Monitor job postings</p>
                        </div>
                        <Switch
                          checked={radarConfig.platforms[platform.name as keyof typeof radarConfig.platforms]}
                          onCheckedChange={(checked) => 
                            setRadarConfig(prev => ({
                              ...prev,
                              platforms: { ...prev.platforms, [platform.name]: checked }
                            }))
                          }
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 text-base font-medium">Keywords to Monitor</Label>
                  <p className="text-gray-400 text-sm mb-2">Enter keywords, skills, or technologies to track</p>
                  <Textarea
                    placeholder="React, TypeScript, Node.js, Python, AWS, Machine Learning, DevOps..."
                    value={radarConfig.keywords}
                    onChange={(e) => setRadarConfig(prev => ({ ...prev, keywords: e.target.value }))}
                    className="bg-black/60 border-white/10 text-white placeholder-gray-400"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-gray-300 text-base font-medium">Auto-Outreach</Label>
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg mt-2">
                    <div>
                      <p className="text-white font-medium">Enable automatic candidate outreach</p>
                      <p className="text-gray-400 text-sm">Automatically reach out to matched candidates</p>
                    </div>
                    <Switch
                      checked={radarConfig.autoOutreach}
                      onCheckedChange={(checked) => 
                        setRadarConfig(prev => ({ ...prev, autoOutreach: checked }))
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Radar className="h-5 w-5 mr-2 text-blue-400" />
                Scraping Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Job Scraping</p>
                    <p className="text-gray-400 text-sm">
                      {scrapingStatus?.is_enabled ? 'Enabled and running' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${scrapingStatus?.is_enabled ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                      {scrapingStatus?.is_enabled ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={triggerScraping}
                      disabled={!scrapingStatus?.is_enabled}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger Scraping
                    </Button>
                  </div>
                </div>

                {scrapingStatus?.last_scraping && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-white font-medium mb-2">Last Scraping</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(scrapingStatus.last_scraping)}
                    </p>
                  </div>
                )}

                {scrapingStatus?.next_scraping && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-white font-medium mb-2">Next Scheduled Scraping</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(scrapingStatus.next_scraping)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}