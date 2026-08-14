// review types
export type Review = {
  id: string;
  submissionId: string;
  reviewer: string;
  createdAt: string;
  status: 'pending' | 'completed';
  sprintTitle?: string;
  anonymousId?: string;
  submittedAt?: string;
  priority?: string;
  testsPassed?: string;
  aiScore?: string;
  solution?: string;
  decision?: string;
  score?: number;
};
