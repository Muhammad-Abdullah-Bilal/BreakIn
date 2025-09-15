// review types
export type Review = {
  id: string;
  submissionId: string;
  reviewer: string;
  createdAt: string;
  status: 'pending' | 'completed';
};
