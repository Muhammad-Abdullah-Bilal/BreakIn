// mentee types
export interface Mentee {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  skills: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'onboarding';
  currentSprint?: string;
  lastActivity?: string;
  completedTasks: number;
  pendingTasks: number;
}

export interface MenteeSubmission {
  id: string;
  menteeId: string;
  sprintId: string;
  taskId: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  feedback?: string;
  score?: number;
}
