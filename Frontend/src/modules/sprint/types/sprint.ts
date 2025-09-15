import { BaseEntity } from "../../core/types/common";

export enum SprintStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done'
}

export interface Sprint extends BaseEntity {
  name: string;
  description: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  goals: string[];
  createdBy: string;
  tasks?: Task[];
}

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  sprintId: string;
  dueDate?: string;
  estimatedHours?: number;
  completedAt?: string | null;
  attachments?: string[];
  tags?: string[];
  comments?: Comment[];
}

export interface Comment extends BaseEntity {
  taskId: string;
  userId: string;
  content: string;
  attachments?: string[];
}

export interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
  averageCycleTime?: number;
  burndownChart?: BurndownPoint[];
}

export interface BurndownPoint {
  date: string;
  remainingTasks: number;
  completedTasks: number;
  idealBurndown: number;
}

export interface SprintFilter {
  status?: SprintStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
}
