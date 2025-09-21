import { z } from 'zod';

// Job Posting Validation Schema
export const jobPostingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  track: z.string().min(1, 'Track is required'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  location: z.string().min(1, 'Location is required'),
  remote: z.boolean(),
  salaryRange: z.object({
    min: z.number().min(0, 'Minimum salary must be positive'),
    max: z.number().min(0, 'Maximum salary must be positive'),
    currency: z.string().min(1, 'Currency is required'),
  }).refine(data => data.max >= data.min, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['max'],
  }),
  companyId: z.string().min(1, 'Company ID is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

// Offer Creation Validation Schema
export const offerSchema = z.object({
  candidateId: z.string().min(1, 'Candidate is required'),
  jobId: z.string().min(1, 'Job position is required'),
  salary: z.object({
    amount: z.number().min(1, 'Salary amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    frequency: z.enum(['hourly', 'monthly', 'yearly']),
  }),
  startDate: z.string().min(1, 'Start date is required'),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  terms: z.string().min(10, 'Terms must be at least 10 characters'),
  benefits: z.array(z.string()).optional(),
}).refine(data => new Date(data.expiresAt) > new Date(data.startDate), {
  message: 'Expiry date must be after start date',
  path: ['expiresAt'],
}).refine(data => new Date(data.startDate) > new Date(), {
  message: 'Start date must be in the future',
  path: ['startDate'],
});

// Candidate Filter Validation Schema
export const candidateFiltersSchema = z.object({
  skills: z.array(z.string()).optional(),
  track: z.string().optional(),
  minReputation: z.number().min(0).max(5).optional(),
  cohort: z.string().optional(),
  availability: z.array(z.enum(['available', 'busy', 'unavailable'])).optional(),
  location: z.string().optional(),
  salaryRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'lead'])).optional(),
});

// Pipeline Note Update Schema
export const pipelineNoteSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters'),
});

// Export types
export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
export type OfferFormData = z.infer<typeof offerSchema>;
export type CandidateFiltersData = z.infer<typeof candidateFiltersSchema>;
export type PipelineNoteData = z.infer<typeof pipelineNoteSchema>;