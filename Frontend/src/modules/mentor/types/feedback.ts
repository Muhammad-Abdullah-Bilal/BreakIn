// feedback types
export interface Feedback {
  id: string;
  reviewId: string;
  mentorId: string;
  menteeId: string;
  createdAt: string;
  updatedAt: string;
  technical: number;
  completeness: number;
  communication: number;
  scores?: Record<string, number>;
  normalizedScore?: number;
  comments: string;
  strengths?: string[];
  improvements?: string[];
  status: 'draft' | 'submitted' | 'acknowledged';
}

export interface FeedbackRubric {
  id: string;
  name: string;
  description?: string;
  components: FeedbackComponent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComponent {
  key: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}
