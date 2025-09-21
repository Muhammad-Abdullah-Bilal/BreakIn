// Domain Types for Sprints, Submissions, Reviews, and Mentor workflows
// Following frozen contracts - names only, shapes owned by shared contracts

export interface Sprint {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  currentParticipants: number;
  isPublic: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements: string[];
  learningObjectives: string[];
  participants: SprintParticipant[];
  tasks: Task[];
  progress: SprintProgress;
  metadata?: Record<string, any>;
}

export interface SprintParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
  role: 'participant' | 'mentor' | 'creator';
  progress: {
    tasksCompleted: number;
    totalTasks: number;
    submissionsCount: number;
    lastActivity: Date;
  };
}

export interface Task {
  id: string;
  sprintId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  order: number;
  tags: string[];
  dependencies: string[]; // Task IDs
  attachments: TaskAttachment[];
  comments: TaskComment[];
}

export interface TaskAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SprintProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  percentage: number;
  milestones: SprintMilestone[];
}

export interface SprintMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  tasks: string[]; // Task IDs
}

export interface Submission {
  id: string;
  taskId: string;
  sprintId: string;
  userId: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  type: 'file_upload' | 'repository_link' | 'live_demo' | 'document';
  content: SubmissionContent;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  grade?: SubmissionGrade;
  feedback: FeedbackThread[];
  proofBadges: ProofBadge[];
  metadata?: Record<string, any>;
}

export interface SubmissionContent {
  files?: SubmissionFile[];
  repositoryUrl?: string;
  demoUrl?: string;
  documentUrl?: string;
  textContent?: string;
  screenshots?: string[];
}

export interface SubmissionFile {
  id: string;
  filename: string;
  path: string;
  url: string;
  type: string;
  size: number;
  content?: string; // For text files
  language?: string; // For syntax highlighting
  diff?: FileDiff;
}

export interface FileDiff {
  added: number;
  deleted: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'delete' | 'modify';
  lineNumber: number;
  content: string;
  oldContent?: string;
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type: 'code_review' | 'design_review' | 'project_review';
  rubric: ReviewRubric;
  summary: string;
  overallScore?: number;
  timeSpent?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  claimedAt?: Date;
  feedback: FeedbackThread[];
  calibration?: MentorCalibration;
}

export interface ReviewRubric {
  criteria: RubricCriterion[];
  totalScore: number;
  maxScore: number;
  weightedScore?: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  score?: number;
  feedback?: string;
  examples?: string[];
}

export interface SubmissionGrade {
  overall: number;
  maxScore: number;
  rubricScores: Record<string, number>;
  feedback: string;
  passed: boolean;
  gradedAt: Date;
  gradedBy: string;
}

export interface FeedbackThread {
  id: string;
  submissionId: string;
  fileId?: string;
  lineNumber?: number;
  type: 'general' | 'code_review' | 'suggestion' | 'question';
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  title?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  comments: FeedbackComment[];
  reactions: FeedbackReaction[];
  tags: string[];
}

export interface FeedbackComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'mentor' | 'participant' | 'admin';
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  attachments: CommentAttachment[];
  reactions: FeedbackReaction[];
  mentions: string[]; // User IDs
}

export interface CommentAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface FeedbackReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface ProofBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  type: 'completion' | 'quality' | 'collaboration' | 'innovation' | 'speed';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  criteria: BadgeCriteria;
  metadata?: Record<string, any>;
}

export interface BadgeCriteria {
  requirements: string[];
  threshold?: number;
  timeLimit?: number; // hours
  dependencies?: string[]; // Other badge IDs
}

export interface MentorCalibration {
  mentorId: string;
  reviewId: string;
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  qualityScore: number; // 0-1
  benchmarkScore?: number; // Compared to other mentors
  notes?: string;
  calibratedAt: Date;
}

// Filter and query types
export interface SprintFilters {
  status?: Sprint['status'][];
  difficulty?: Sprint['difficulty'][];
  tags?: string[];
  search?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ReviewFilters {
  status?: Review['status'][];
  type?: Review['type'][];
  priority?: string[];
  assignedToMe?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface SubmissionFilters {
  status?: Submission['status'][];
  type?: Submission['type'][];
  sprintId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

// Realtime event types
export interface RealtimeEvent<T = any> {
  type: string;
  channel: string;
  data: T;
  timestamp: Date;
  userId?: string;
}

export interface SprintUpdateEvent extends RealtimeEvent {
  type: 'sprints.updated';
  channel: `sprints.${string}`;
  data: {
    sprintId: string;
    changes: Partial<Sprint>;
    updatedBy: string;
  };
}

export interface ReviewEvent extends RealtimeEvent {
  type: 'reviews.created' | 'reviews.updated' | 'reviews.completed';
  channel: `reviews.${string}` | 'reviews.all';
  data: Review;
}

export interface FeedbackEvent extends RealtimeEvent {
  type: 'feedback.created' | 'feedback.updated';
  channel: `submission.${string}`;
  data: FeedbackThread | FeedbackComment;
}

export interface SubmissionEvent extends RealtimeEvent {
  type: 'submissions.created' | 'submissions.updated';
  channel: `submissions.${string}`;
  data: Submission;
}