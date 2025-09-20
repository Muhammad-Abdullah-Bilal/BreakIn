// Core Domain Types for Recruiting Platform

export interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
  track: string;
  reputation: number;
  experience: string;
  location: string;
  availability: 'available' | 'busy' | 'unavailable';
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  cohort?: string;
  bio: string;
  proofItems: ProofItem[];
  sprintHistory: SprintHistory[];
  feedback: Feedback[];
  createdAt: string;
  updatedAt: string;
}

export interface ProofItem {
  id: string;
  type: 'project' | 'certification' | 'achievement';
  title: string;
  description: string;
  url?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  tags: string[];
  createdAt: string;
}

export interface SprintHistory {
  id: string;
  projectName: string;
  role: string;
  duration: string;
  outcome: string;
  rating: number;
  feedback: string;
  completedAt: string;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  author: string;
  projectId?: string;
  createdAt: string;
}

export interface MatchScore {
  candidateId: string;
  jobId: string;
  score: number;
  reasons: string[];
  skillsMatch: number;
  experienceMatch: number;
  availabilityMatch: number;
  locationMatch: number;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  track: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  location: string;
  remote: boolean;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  companyId: string;
  companyName: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type PipelineStage = 'sourced' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface PipelineItem {
  id: string;
  candidateId: string;
  candidate: Candidate;
  jobId: string;
  jobTitle: string;
  stage: PipelineStage;
  notes: string;
  addedAt: string;
  updatedAt: string;
  addedBy: string;
  matchScore?: number;
}

export interface Offer {
  id: string;
  candidateId: string;
  candidate: Candidate;
  jobId: string;
  jobTitle: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  salary: {
    amount: number;
    currency: string;
    frequency: 'hourly' | 'monthly' | 'yearly';
  };
  startDate: string;
  expiresAt: string;
  terms: string;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  respondedAt?: string;
}

export interface Contract {
  id: string;
  offerId: string;
  candidateId: string;
  jobId: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  signedAt?: string;
  startDate: string;
  endDate?: string;
  terms: string;
  documents: ContractDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractDocument {
  id: string;
  name: string;
  type: 'contract' | 'nda' | 'agreement';
  url: string;
  signedAt?: string;
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Payout {
  id: string;
  candidateId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  contractId: string;
  description: string;
  processedAt?: string;
  createdAt: string;
}

export interface ReportRow {
  id: string;
  date: string;
  metric: string;
  value: number;
  category: string;
  filters: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  size: string;
  location: string;
  website?: string;
  description: string;
  createdAt: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  companyId: string;
  role: 'admin' | 'recruiter' | 'viewer';
  permissions: string[];
  createdAt: string;
}

// Filter schemas
export interface CandidateFilters {
  skills: string[];
  track?: string;
  minReputation?: number;
  cohort?: string;
  availability: string[];
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  experienceLevel: string[];
}

export interface JobFilters {
  status: string[];
  track?: string;
  experienceLevel: string[];
  remote?: boolean;
  location?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KPIData {
  totalCandidates: number;
  activeJobs: number;
  pendingOffers: number;
  hiredThisMonth: number;
  averageTimeToHire: number;
  conversionRate: number;
  topSkills: { skill: string; count: number }[];
  hiringFunnel: { stage: string; count: number }[];
}

// Realtime event types
export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
}