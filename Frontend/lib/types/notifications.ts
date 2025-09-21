// Notification Type Definitions

export interface BaseNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'sprint_update'      // Sprint-related updates (started, completed, blocked)
  | 'review_request'     // Code review requests
  | 'review_completed'   // Review feedback available
  | 'pipeline_status'    // CI/CD pipeline notifications
  | 'team_update'        // Team or project announcements
  | 'mention'           // User mentions in comments
  | 'milestone'         // Project milestone achievements
  | 'system'            // System-wide notifications
  | 'security'          // Security alerts
  | 'deadline'          // Deadline reminders
  | 'achievement';      // User achievements/badges

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  types: Record<NotificationType, boolean>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Action-specific notification interfaces
export interface SprintNotification extends BaseNotification {
  type: 'sprint_update';
  metadata: {
    sprintId: string;
    sprintName: string;
    status: 'started' | 'completed' | 'blocked' | 'updated';
    teamId?: string;
  };
}

export interface ReviewNotification extends BaseNotification {
  type: 'review_request' | 'review_completed';
  metadata: {
    reviewId: string;
    submissionId: string;
    reviewerName?: string;
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  };
}

export interface MentionNotification extends BaseNotification {
  type: 'mention';
  metadata: {
    mentionedBy: string;
    contextType: 'comment' | 'review' | 'chat';
    contextId: string;
    contextUrl: string;
  };
}

export type AppNotification = 
  | SprintNotification 
  | ReviewNotification 
  | MentionNotification 
  | BaseNotification;