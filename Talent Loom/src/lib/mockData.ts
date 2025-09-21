import { Candidate, JobPosting, PipelineItem, Offer, KPIData, MatchScore } from '@/types';

// Mock API delay for realistic loading states
export const mockApiDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Candidates Data
export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b56d7b58?w=150&h=150&fit=crop&crop=face',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    track: 'Frontend Development',
    reputation: 4.8,
    experience: '5+ years',
    location: 'San Francisco, CA',
    availability: 'available',
    salaryExpectation: { min: 120000, max: 150000, currency: 'USD' },
    cohort: '2023-Q1',
    bio: 'Senior frontend developer with expertise in React ecosystem and modern web technologies.',
    proofItems: [
      {
        id: '1',
        type: 'project',
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform serving 10k+ users',
        url: 'https://github.com/sarachen/ecommerce',
        verificationStatus: 'verified',
        tags: ['React', 'Node.js', 'MongoDB'],
        createdAt: '2024-01-15T00:00:00Z'
      }
    ],
    sprintHistory: [
      {
        id: '1',
        projectName: 'TechCorp Dashboard',
        role: 'Lead Frontend Developer',
        duration: '3 months',
        outcome: 'Successfully delivered on time with 95% client satisfaction',
        rating: 5,
        feedback: 'Exceptional work quality and leadership skills',
        completedAt: '2024-03-01T00:00:00Z'
      }
    ],
    feedback: [
      {
        id: '1',
        rating: 5,
        comment: 'Outstanding developer with great communication skills',
        author: 'Tech Lead at StartupXYZ',
        projectId: '1',
        createdAt: '2024-03-05T00:00:00Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
    track: 'Backend Development',
    reputation: 4.6,
    experience: '4 years',
    location: 'New York, NY',
    availability: 'available',
    salaryExpectation: { min: 110000, max: 140000, currency: 'USD' },
    cohort: '2023-Q2',
    bio: 'Backend specialist with strong experience in Python and cloud architecture.',
    proofItems: [],
    sprintHistory: [],
    feedback: [],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    email: 'elena.r@email.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS3'],
    track: 'Frontend Development',
    reputation: 4.9,
    experience: '6+ years',
    location: 'Austin, TX',
    availability: 'busy',
    salaryExpectation: { min: 130000, max: 160000, currency: 'USD' },
    cohort: '2022-Q4',
    bio: 'Senior frontend architect with deep expertise in modern frameworks.',
    proofItems: [],
    sprintHistory: [],
    feedback: [],
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-03-12T00:00:00Z'
  }
];

// Mock Job Postings
export const mockJobPostings: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    description: 'We are looking for an experienced frontend developer to join our growing team.',
    requirements: ['5+ years React experience', 'Strong TypeScript skills', 'Experience with testing'],
    skills: ['React', 'TypeScript', 'Jest', 'CSS3'],
    track: 'Frontend Development',
    experienceLevel: 'senior',
    location: 'San Francisco, CA',
    remote: true,
    salaryRange: { min: 120000, max: 160000, currency: 'USD' },
    companyId: '1',
    companyName: 'TechCorp Inc.',
    status: 'active',
    applicationsCount: 24,
    viewsCount: 156,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z'
  },
  {
    id: '2',
    title: 'Backend Engineer',
    description: 'Join our backend team to build scalable microservices architecture.',
    requirements: ['3+ years Python experience', 'Database design skills', 'API development'],
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    track: 'Backend Development',
    experienceLevel: 'mid',
    location: 'New York, NY',
    remote: false,
    salaryRange: { min: 100000, max: 130000, currency: 'USD' },
    companyId: '2',
    companyName: 'StartupXYZ',
    status: 'active',
    applicationsCount: 18,
    viewsCount: 89,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z'
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    description: 'Looking for a versatile developer to work on both frontend and backend.',
    requirements: ['Full stack experience', 'React and Node.js', 'Database knowledge'],
    skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    track: 'Full Stack Development',
    experienceLevel: 'mid',
    location: 'Remote',
    remote: true,
    salaryRange: { min: 90000, max: 120000, currency: 'USD' },
    companyId: '3',
    companyName: 'RemoteFirst Co.',
    status: 'active',
    applicationsCount: 31,
    viewsCount: 203,
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-14T00:00:00Z'
  }
];

// Mock Pipeline Items
export const mockPipelineItems: PipelineItem[] = [
  {
    id: '1',
    candidateId: '1',
    candidate: mockCandidates[0],
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    stage: 'shortlisted',
    notes: 'Strong React background, great portfolio',
    addedAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-12T00:00:00Z',
    addedBy: 'Recruiter 1',
    matchScore: 92
  },
  {
    id: '2',
    candidateId: '2',
    candidate: mockCandidates[1],
    jobId: '2',
    jobTitle: 'Backend Engineer',
    stage: 'interview',
    notes: 'Scheduled for technical interview',
    addedAt: '2024-03-08T00:00:00Z',
    updatedAt: '2024-03-13T00:00:00Z',
    addedBy: 'Recruiter 2',
    matchScore: 88
  },
  {
    id: '3',
    candidateId: '3',
    candidate: mockCandidates[2],
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    stage: 'offer',
    notes: 'Excellent interview performance',
    addedAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-14T00:00:00Z',
    addedBy: 'Recruiter 1',
    matchScore: 95
  }
];

// Mock Offers
export const mockOffers: Offer[] = [
  {
    id: '1',
    candidateId: '1',
    candidate: mockCandidates[0],
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    status: 'sent',
    salary: { amount: 140000, currency: 'USD', frequency: 'yearly' },
    startDate: '2024-04-01T00:00:00Z',
    expiresAt: '2024-03-25T00:00:00Z',
    terms: 'Full-time position with benefits',
    benefits: ['Health Insurance', '401k', 'Remote Work', 'PTO'],
    createdAt: '2024-03-12T00:00:00Z',
    updatedAt: '2024-03-13T00:00:00Z',
    sentAt: '2024-03-13T00:00:00Z'
  },
  {
    id: '2',
    candidateId: '3',
    candidate: mockCandidates[2],
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    status: 'accepted',
    salary: { amount: 150000, currency: 'USD', frequency: 'yearly' },
    startDate: '2024-04-15T00:00:00Z',
    expiresAt: '2024-03-20T00:00:00Z',
    terms: 'Senior level position with equity',
    benefits: ['Health Insurance', '401k', 'Stock Options', 'Remote Work'],
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
    sentAt: '2024-03-11T00:00:00Z',
    respondedAt: '2024-03-15T00:00:00Z'
  }
];

// Mock KPI Data
export const mockKPIData: KPIData = {
  totalCandidates: 1247,
  activeJobs: 23,
  pendingOffers: 8,
  hiredThisMonth: 12,
  averageTimeToHire: 18.5,
  conversionRate: 24.8,
  topSkills: [
    { skill: 'React', count: 345 },
    { skill: 'JavaScript', count: 298 },
    { skill: 'Python', count: 267 },
    { skill: 'Node.js', count: 234 },
    { skill: 'TypeScript', count: 198 }
  ],
  hiringFunnel: [
    { stage: 'Sourced', count: 1247 },
    { stage: 'Shortlisted', count: 456 },
    { stage: 'Interview', count: 123 },
    { stage: 'Offer', count: 45 },
    { stage: 'Hired', count: 28 }
  ]
};

// Mock Match Scores
export const mockMatchScores: MatchScore[] = [
  {
    candidateId: '1',
    jobId: '1',
    score: 92,
    reasons: ['Strong React experience', 'TypeScript expertise', 'Location match'],
    skillsMatch: 95,
    experienceMatch: 90,
    availabilityMatch: 100,
    locationMatch: 85
  },
  {
    candidateId: '2',
    jobId: '2',
    score: 88,
    reasons: ['Python expertise', 'Database skills', 'Experience level match'],
    skillsMatch: 90,
    experienceMatch: 85,
    availabilityMatch: 100,
    locationMatch: 75
  },
  {
    candidateId: '3',
    jobId: '1',
    score: 95,
    reasons: ['Excellent React skills', 'Senior experience', 'High reputation'],
    skillsMatch: 98,
    experienceMatch: 95,
    availabilityMatch: 80,
    locationMatch: 90
  }
];