import { BaseEntity } from "../../core/types/common";

export enum UserRole {
  DEVELOPER = 'developer',
  MENTOR = 'mentor',
  COMPANY = 'company',
  ADMIN = 'admin'
}

export enum ExperienceLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert'
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  skills?: string[];
  jobTitle?: string;
  company?: string;
  location?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  experienceLevel?: ExperienceLevel;
  yearsOfExperience?: number;
  isVerified: boolean;
  lastActive?: string;
  preferences?: UserPreferences;
  portfolioProjects?: PortfolioProject[];
  educations?: Education[];
  workExperiences?: WorkExperience[];
  certifications?: Certification[];
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  repositoryUrl?: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  description?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentPosition?: boolean;
  description?: string;
  technologies?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialUrl?: string;
  credentialId?: string;
}
