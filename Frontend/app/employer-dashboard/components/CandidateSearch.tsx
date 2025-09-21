'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import CandidateProfile from './CandidateProfile'
import { Search, Filter, Star, MapPin, Clock, DollarSign, User, Code, Briefcase, GraduationCap } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  title: string
  location: string
  experience: number
  skills: string[]
  matchScore: number
  availability: 'available' | 'passive' | 'unavailable'
  salaryExpectation: number
  education: string
  lastActive: string
  avatar?: string
}

interface SearchFilters {
  keyword: string
  location: string
  remoteOk: boolean
  experienceRange: [number, number]
  salaryRange: [number, number]
  availability: string
  skills: string[]
  education: string
  sortBy: string
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Senior Full Stack Developer',
    location: 'San Francisco, CA',
    experience: 6,
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
    matchScore: 95,
    availability: 'available',
    salaryExpectation: 150000,
    education: 'Master\'s in Computer Science',
    lastActive: '2 hours ago',
    avatar: '/placeholder-user.jpg'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'DevOps Engineer',
    location: 'Austin, TX',
    experience: 4,
    skills: ['Docker', 'Kubernetes', 'Python', 'Terraform', 'Jenkins'],
    matchScore: 88,
    availability: 'passive',
    salaryExpectation: 130000,
    education: 'Bachelor\'s in Engineering',
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Frontend Developer',
    location: 'Remote',
    experience: 3,
    skills: ['React', 'Vue.js', 'CSS', 'JavaScript', 'Figma'],
    matchScore: 82,
    availability: 'available',
    salaryExpectation: 95000,
    education: 'Bachelor\'s in Design',
    lastActive: '30 minutes ago'
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'Backend Developer',
    location: 'Seattle, WA',
    experience: 8,
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Microservices'],
    matchScore: 91,
    availability: 'passive',
    salaryExpectation: 165000,
    education: 'Master\'s in Software Engineering',
    lastActive: '3 hours ago'
  }
]

const skillOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API'
]

export default function CandidateSearch() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates)
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    location: '',
    remoteOk: false,
    experienceRange: [0, 15],
    salaryRange: [50000, 300000],
    availability: 'all',
    skills: [],
    education: 'all',
    sortBy: 'match_score'
  })

  const handleSearch = () => {
    let filtered = candidates.filter(candidate => {
      // Keyword search
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const matchesKeyword = 
          candidate.name.toLowerCase().includes(keyword) ||
          candidate.title.toLowerCase().includes(keyword) ||
          candidate.skills.some(skill => skill.toLowerCase().includes(keyword))
        if (!matchesKeyword) return false
      }

      // Location filter
      if (filters.location && !filters.remoteOk) {
        if (!candidate.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false
        }
      }

      // Remote filter
      if (filters.remoteOk && !candidate.location.toLowerCase().includes('remote')) {
        // Allow remote candidates or those in specified location
      }

      // Experience range
      if (candidate.experience < filters.experienceRange[0] || candidate.experience > filters.experienceRange[1]) {
        return false
      }

      // Salary range
      if (candidate.salaryExpectation < filters.salaryRange[0] || candidate.salaryExpectation > filters.salaryRange[1]) {
        return false
      }

      // Availability
      if (filters.availability !== 'all' && candidate.availability !== filters.availability) {
        return false
      }

      // Skills
      if (filters.skills.length > 0) {
        const hasRequiredSkills = filters.skills.some(skill => 
          candidate.skills.some(candidateSkill => 
            candidateSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
        if (!hasRequiredSkills) return false
      }

      return true
    })

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'match_score':
          return b.matchScore - a.matchScore
        case 'experience':
          return b.experience - a.experience
        case 'salary':
          return b.salaryExpectation - a.salaryExpectation
        case 'last_active':
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        default:
          return b.matchScore - a.matchScore
      }
    })

    setFilteredCandidates(filtered)
  }

  const addSkillFilter = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
  }

  const removeSkillFilter = (skill: string) => {
    setFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-600'
      case 'passive': return 'bg-yellow-600'
      case 'unavailable': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Candidate Search</h2>
          <p className="text-gray-400">Find and connect with top talent</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/10 text-white hover:bg-white/5 bg-transparent"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, title, or skills..."
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                className="bg-black/60 border-white/10 text-white"
              />
            </div>
            <div className="w-64">
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="bg-black/60 border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Remote Work */}
              <div className="space-y-2">
                <Label className="text-gray-300">Remote Work</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.remoteOk}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, remoteOk: checked }))}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="text-white text-sm">Open to remote candidates</span>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label className="text-gray-300">Availability</Label>
                <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                  <SelectTrigger className="bg-black/60 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="passive">Passive</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-gray-300">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="bg-black/60 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match_score">Match Score</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="salary">Salary Expectation</SelectItem>
                    <SelectItem value="last_active">Last Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Experience Range */}
            <div className="space-y-2">
              <Label className="text-gray-300">Experience Range: {filters.experienceRange[0]} - {filters.experienceRange[1]} years</Label>
              <Slider
                value={filters.experienceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, experienceRange: value as [number, number] }))}
                max={15}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label className="text-gray-300">Salary Range: ${filters.salaryRange[0].toLocaleString()} - ${filters.salaryRange[1].toLocaleString()}</Label>
              <Slider
                value={filters.salaryRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, salaryRange: value as [number, number] }))}
                max={300000}
                min={50000}
                step={5000}
                className="w-full"
              />
            </div>

            {/* Skills Filter */}
            <div className="space-y-2">
              <Label className="text-gray-300">Required Skills</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.skills.map(skill => (
                  <Badge key={skill} className="bg-blue-600 text-white cursor-pointer" onClick={() => removeSkillFilter(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {skillOptions.filter(skill => !filters.skills.includes(skill)).map(skill => (
                  <Badge key={skill} variant="outline" className="cursor-pointer border-white/20 text-gray-300 hover:bg-white/5" onClick={() => addSkillFilter(skill)}>
                    + {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-gray-400">{filteredCandidates.length} candidates found</p>
      </div>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCandidates.map(candidate => (
          <Card key={candidate.id} className="bg-black/40 border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors cursor-pointer" onClick={() => {
            setSelectedCandidate(candidate)
            setShowProfile(true)
          }}>)
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={candidate.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white truncate">{candidate.name}</h3>
                      <p className="text-gray-300 text-sm">{candidate.title}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-white font-medium">{candidate.matchScore}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{candidate.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{candidate.experience} years</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${candidate.salaryExpectation.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getAvailabilityColor(candidate.availability)} text-white text-xs`}>
                        {candidate.availability}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{candidate.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No candidates found</h3>
            <p className="text-gray-400">Try adjusting your search criteria or filters</p>
          </CardContent>
        </Card>
      )}
      
      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <CandidateProfile
          candidate={selectedCandidate}
          isOpen={showProfile}
          onClose={() => {
            setShowProfile(false)
            setSelectedCandidate(null)
          }}
          onContact={(candidateId) => {
            console.log('Contact candidate:', candidateId)
            // Handle contact logic
          }}
          onAddToPipeline={(candidateId) => {
            console.log('Add to pipeline:', candidateId)
            // Handle add to pipeline logic
          }}
        />
      )}
    </div>
  )
}