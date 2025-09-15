import { BaseEntity } from "../../core/types/common";

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive'
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  FILLED = 'filled'
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  HIRED = 'hired',
  WITHDRAWN = 'withdrawn'
}

export interface Job extends BaseEntity {
  title: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  description: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  location: string;
  isRemote: boolean;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  status: JobStatus;
  postedBy: string;
  postedAt: string;
  expiresAt?: string;
  applicationsCount?: number;
}

export interface JobApplication extends BaseEntity {
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  appliedAt: string;
  lastStatusUpdateAt: string;
  notes?: string;
  interviewDate?: string;
}

export interface JobFilter {
  keyword?: string;
  location?: string;
  isRemote?: boolean;
  types?: JobType[];
  experienceLevels?: ExperienceLevel[];
  skills?: string[];
  minSalary?: number;
  postedWithin?: number; // days
}
