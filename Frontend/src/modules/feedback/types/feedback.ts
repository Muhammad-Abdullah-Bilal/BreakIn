import { BaseEntity } from "../../core/types/common";

export enum FeedbackType {
  CODE_REVIEW = 'code_review',
  SPRINT_REVIEW = 'sprint_review',
  MENTOR_FEEDBACK = 'mentor_feedback',
  PEER_FEEDBACK = 'peer_feedback',
  COMPANY_FEEDBACK = 'company_feedback'
}

export enum FeedbackRating {
  EXCELLENT = 5,
  GOOD = 4,
  SATISFACTORY = 3,
  NEEDS_IMPROVEMENT = 2,
  POOR = 1
}

export interface Feedback extends BaseEntity {
  type: FeedbackType;
  fromUserId: string;
  toUserId: string;
  projectId?: string;
  sprintId?: string;
  taskId?: string;
  content: string;
  rating?: FeedbackRating;
  categories?: FeedbackCategory[];
  isAnonymous?: boolean;
}

export interface FeedbackCategory {
  name: string;
  rating: FeedbackRating;
  comment?: string;
}

export interface CodeReviewFeedback extends Feedback {
  type: FeedbackType.CODE_REVIEW;
  codeQualityRating: FeedbackRating;
  cleanCodeRating: FeedbackRating;
  bestPracticesRating: FeedbackRating;
  suggestionPoints: string[];
  commitId?: string;
  prId?: string;
  lineComments?: CodeReviewLineComment[];
}

export interface CodeReviewLineComment {
  id: string;
  filePath: string;
  lineNumber: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  isResolved: boolean;
}

export interface SprintReviewFeedback extends Feedback {
  type: FeedbackType.SPRINT_REVIEW;
  completionRating: FeedbackRating;
  qualityRating: FeedbackRating;
  collaborationRating: FeedbackRating;
  communicationRating: FeedbackRating;
  achievements: string[];
  areasForImprovement: string[];
}

export interface MentorFeedback extends Feedback {
  type: FeedbackType.MENTOR_FEEDBACK;
  technicalSkillsRating: FeedbackRating;
  softSkillsRating: FeedbackRating;
  problemSolvingRating: FeedbackRating;
  growthAreasRating: FeedbackRating;
  strengths: string[];
  growthAreas: string[];
  recommendedResources?: string[];
}

export interface FeedbackSummary {
  userId: string;
  overallRating: number;
  totalFeedbacks: number;
  categoriesAverage: Record<string, number>;
  recentFeedbacks: Feedback[];
  strengthsFrequency: Record<string, number>;
  improvementAreasFrequency: Record<string, number>;
}
