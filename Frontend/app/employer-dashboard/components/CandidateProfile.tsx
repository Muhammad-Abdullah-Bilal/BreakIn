'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Globe, 
  Award, 
  Code, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  MessageSquare,
  UserPlus,
  Download,
  ExternalLink
} from 'lucide-react'

interface Skill {
  name: string
  level: number // 1-100
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'other'
  yearsOfExperience: number
  lastUsed: string
}

interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  role: string
  duration: string
  achievements: string[]
  url?: string
}

interface Experience {
  id: string
  company: string
  position: string
  duration: string
  location: string
  description: string
  achievements: string[]
  technologies: string[]
}

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  duration: string
  gpa?: string
  achievements?: string[]
}

interface CandidateProfileData {
  id: string
  name: string
  title: string
  location: string
  email: string
  phone?: string
  linkedIn?: string
  github?: string
  portfolio?: string
  avatar?: string
  summary: string
  experience: number
  availability: 'available' | 'passive' | 'unavailable'
  salaryExpectation: number
  preferredRoles: string[]
  workPreference: 'remote' | 'hybrid' | 'onsite' | 'flexible'
  skills: Skill[]
  projects: Project[]
  workExperience: Experience[]
  education: Education[]
  certifications: string[]
  languages: { name: string; proficiency: string }[]
  matchScore: number
  strengths: string[]
  growthAreas: string[]
  lastActive: string
  responseRate: number
  interviewSuccess: number
}

interface CandidateProfileProps {
  candidate: any
  isOpen: boolean
  onClose: () => void
  onContact: (candidateId: string) => void
  onAddToPipeline: (candidateId: string) => void
}

const mockCandidate: CandidateProfileData = {
  id: '1',
  name: 'Sarah Chen',
  title: 'Senior Full Stack Developer',
  location: 'San Francisco, CA',
  email: 'sarah.chen@email.com',
  phone: '+1 (555) 123-4567',
  linkedIn: 'linkedin.com/in/sarahchen',
  github: 'github.com/sarahchen',
  portfolio: 'sarahchen.dev',
  avatar: '/placeholder-user.jpg',
  summary: 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Led multiple successful product launches and mentored junior developers.',
  experience: 6,
  availability: 'available',
  salaryExpectation: 150000,
  preferredRoles: ['Senior Full Stack Developer', 'Tech Lead', 'Frontend Architect'],
  workPreference: 'hybrid',
  skills: [
    { name: 'React', level: 95, category: 'frontend', yearsOfExperience: 5, lastUsed: '2024-01-15' },
    { name: 'TypeScript', level: 90, category: 'frontend', yearsOfExperience: 4, lastUsed: '2024-01-15' },
    { name: 'Node.js', level: 88, category: 'backend', yearsOfExperience: 5, lastUsed: '2024-01-10' },
    { name: 'Python', level: 82, category: 'backend', yearsOfExperience: 3, lastUsed: '2023-12-20' },
    { name: 'AWS', level: 85, category: 'devops', yearsOfExperience: 4, lastUsed: '2024-01-12' },
    { name: 'MongoDB', level: 80, category: 'database', yearsOfExperience: 4, lastUsed: '2024-01-08' },
    { name: 'PostgreSQL', level: 75, category: 'database', yearsOfExperience: 3, lastUsed: '2023-11-15' },
    { name: 'Docker', level: 78, category: 'devops', yearsOfExperience: 3, lastUsed: '2024-01-05' }
  ],
  projects: [
    {
      id: 'p1',
      name: 'E-commerce Platform',
      description: 'Built a scalable e-commerce platform serving 100K+ users',
      technologies: ['React', 'Node.js', 'MongoDB', 'AWS'],
      role: 'Lead Developer',
      duration: '8 months',
      achievements: [
        'Improved page load times by 40%',
        'Implemented real-time inventory management',
        'Led team of 4 developers'
      ],
      url: 'github.com/sarahchen/ecommerce'
    },
    {
      id: 'p2',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard for business intelligence',
      technologies: ['React', 'D3.js', 'Python', 'PostgreSQL'],
      role: 'Frontend Lead',
      duration: '6 months',
      achievements: [
        'Processed 1M+ data points daily',
        'Created interactive visualizations',
        'Reduced query response time by 60%'
      ]
    }
  ],
  workExperience: [
    {
      id: 'e1',
      company: 'TechCorp Inc.',
      position: 'Senior Full Stack Developer',
      duration: '2022 - Present',
      location: 'San Francisco, CA',
      description: 'Lead development of customer-facing applications and internal tools',
      achievements: [
        'Architected microservices handling 10M+ requests/day',
        'Mentored 3 junior developers',
        'Reduced deployment time by 70% through CI/CD improvements'
      ],
      technologies: ['React', 'Node.js', 'AWS', 'MongoDB']
    },
    {
      id: 'e2',
      company: 'StartupXYZ',
      position: 'Full Stack Developer',
      duration: '2020 - 2022',
      location: 'San Francisco, CA',
      description: 'Built core product features and scaled infrastructure',
      achievements: [
        'Developed MVP that acquired first 1000 users',
        'Implemented payment processing system',
        'Optimized database queries improving performance by 50%'
      ],
      technologies: ['Vue.js', 'Python', 'PostgreSQL', 'Docker']
    }
  ],
  education: [
    {
      id: 'ed1',
      institution: 'Stanford University',
      degree: 'Master of Science',
      field: 'Computer Science',
      duration: '2018 - 2020',
      gpa: '3.8/4.0',
      achievements: ['Dean\'s List', 'Research in Machine Learning']
    },
    {
      id: 'ed2',
      institution: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      duration: '2014 - 2018',
      gpa: '3.7/4.0'
    }
  ],
  certifications: [
    'AWS Certified Solutions Architect',
    'Google Cloud Professional Developer',
    'MongoDB Certified Developer'
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Mandarin', proficiency: 'Fluent' },
    { name: 'Spanish', proficiency: 'Conversational' }
  ],
  matchScore: 95,
  strengths: [
    'Strong technical leadership',
    'Excellent problem-solving skills',
    'Experience with scalable systems',
    'Mentoring and team collaboration'
  ],
  growthAreas: [
    'Mobile development',
    'Machine learning applications',
    'DevOps automation'
  ],
  lastActive: '2 hours ago',
  responseRate: 85,
  interviewSuccess: 92
}

export default function CandidateProfile({ 
  candidate: rawCandidate, 
  isOpen, 
  onClose, 
  onContact, 
  onAddToPipeline 
}: CandidateProfileProps) {
  const candidate = {
    ...mockCandidate,
    ...rawCandidate,
    skills: Array.isArray(rawCandidate?.skills) && typeof rawCandidate.skills[0] === 'string'
      ? (rawCandidate.skills as string[]).map((s, idx) => ({
          name: s,
          level: 80 + (idx * 5) % 15,
          category: (idx % 2 === 0 ? 'frontend' : 'backend') as any,
          yearsOfExperience: 3,
          lastUsed: '2024-01-01'
        }))
      : (rawCandidate?.skills || mockCandidate.skills)
  }
  const [activeTab, setActiveTab] = useState('overview')

  const getSkillColor = (level: number) => {
    if (level >= 90) return 'bg-green-500'
    if (level >= 75) return 'bg-blue-500'
    if (level >= 60) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frontend': return <Globe className="h-4 w-4" />
      case 'backend': return <Code className="h-4 w-4" />
      case 'database': return <Award className="h-4 w-4" />
      case 'devops': return <TrendingUp className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={candidate.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl text-white">{candidate.name}</DialogTitle>
                <p className="text-lg text-gray-300 mt-1">{candidate.title}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidate.experience} years experience</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Last active {candidate.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-white">{candidate.matchScore}%</span>
              </div>
              <Badge className={`${getAvailabilityColor(candidate.availability)} text-white`}>
                {candidate.availability}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Button onClick={() => onContact(candidate.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button onClick={() => onAddToPipeline(candidate.id)} variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <UserPlus className="h-4 w-4 mr-2" />
              Add to Pipeline
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </Button>
          </div>

          {/* Contact Info & Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Mail className="h-4 w-4" />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Phone className="h-4 w-4" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.linkedIn && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Linkedin className="h-4 w-4" />
                      <span>{candidate.linkedIn}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                  {candidate.github && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Github className="h-4 w-4" />
                      <span>{candidate.github}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-3">Engagement Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Response Rate</span>
                      <span className="text-white">{candidate.responseRate}%</span>
                    </div>
                    <Progress value={candidate.responseRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Interview Success</span>
                      <span className="text-white">{candidate.interviewSuccess}%</span>
                    </div>
                    <Progress value={candidate.interviewSuccess} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-3">Preferences</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Salary Expectation</span>
                    <span className="text-white">${candidate.salaryExpectation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Work Preference</span>
                    <span className="text-white capitalize">{candidate.workPreference}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Preferred Roles</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.preferredRoles.slice(0, 2).map(role => (
                        <Badge key={role} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/60 border-white/10">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">Overview</TabsTrigger>
              <TabsTrigger value="skills" className="text-white data-[state=active]:bg-blue-600">Skills</TabsTrigger>
              <TabsTrigger value="experience" className="text-white data-[state=active]:bg-blue-600">Experience</TabsTrigger>
              <TabsTrigger value="projects" className="text-white data-[state=active]:bg-blue-600">Projects</TabsTrigger>
              <TabsTrigger value="education" className="text-white data-[state=active]:bg-blue-600">Education</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <Card className="bg-black/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">{candidate.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-white">Key Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center space-x-2 text-gray-300">
                            <Star className="h-4 w-4 text-green-500" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-white">Growth Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.growthAreas.map((area, index) => (
                          <li key={index} className="flex items-center space-x-2 text-gray-300">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <div className="space-y-6">
                {['frontend', 'backend', 'database', 'devops'].map(category => {
                  const categorySkills = candidate.skills.filter(skill => skill.category === category)
                  if (categorySkills.length === 0) return null
                  
                  return (
                    <Card key={category} className="bg-black/40 border-white/5">
                      <CardHeader>
                        <CardTitle className="text-white capitalize flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span>{category} Skills</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorySkills.map(skill => (
                            <div key={skill.name} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-white font-medium">{skill.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-400">{skill.yearsOfExperience}y</span>
                                  <Badge className={`${getSkillColor(skill.level)} text-white text-xs`}>
                                    {skill.level}%
                                  </Badge>
                                </div>
                              </div>
                              <Progress value={skill.level} className="h-2" />
                              <p className="text-xs text-gray-400">Last used: {skill.lastUsed}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
              <div className="space-y-4">
                {candidate.workExperience.map(exp => (
                  <Card key={exp.id} className="bg-black/40 border-white/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{exp.position}</h3>
                          <p className="text-blue-400 font-medium">{exp.company}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{exp.duration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{exp.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{exp.description}</p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white font-medium mb-2">Key Achievements</h4>
                          <ul className="space-y-1">
                            {exp.achievements.map((achievement, index) => (
                              <li key={index} className="flex items-start space-x-2 text-gray-300">
                                <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-2">Technologies Used</h4>
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map(tech => (
                              <Badge key={tech} variant="secondary" className="bg-gray-700 text-gray-300">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <div className="space-y-4">
                {candidate.projects.map(project => (
                  <Card key={project.id} className="bg-black/40 border-white/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                          <p className="text-blue-400 font-medium">{project.role}</p>
                          <p className="text-sm text-gray-400 mt-1">{project.duration}</p>
                        </div>
                        {project.url && (
                          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/5">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Project
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-300 mb-4">{project.description}</p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white font-medium mb-2">Key Achievements</h4>
                          <ul className="space-y-1">
                            {project.achievements.map((achievement, index) => (
                              <li key={index} className="flex items-start space-x-2 text-gray-300">
                                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-2">Technologies</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map(tech => (
                              <Badge key={tech} variant="secondary" className="bg-gray-700 text-gray-300">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="education" className="mt-6">
              <div className="space-y-6">
                <Card className="bg-black/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.education.map(edu => (
                        <div key={edu.id} className="border-l-2 border-blue-500 pl-4">
                          <h3 className="text-white font-semibold">{edu.degree} in {edu.field}</h3>
                          <p className="text-blue-400">{edu.institution}</p>
                          <p className="text-sm text-gray-400">{edu.duration}</p>
                          {edu.gpa && <p className="text-sm text-gray-400">GPA: {edu.gpa}</p>}
                          {edu.achievements && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-2">
                                {edu.achievements.map(achievement => (
                                  <Badge key={achievement} variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-white">Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {candidate.certifications.map(cert => (
                          <div key={cert} className="flex items-center space-x-2 text-gray-300">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-white">Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {candidate.languages.map(lang => (
                          <div key={lang.name} className="flex justify-between items-center">
                            <span className="text-gray-300">{lang.name}</span>
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                              {lang.proficiency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}