// Support and Helpdesk Types
// Frozen contracts - PR required to change

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  assignedToId?: string;
  assignedToName?: string;
  tags: string[];
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  metadata: TicketMetadata;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  iconName: string;
  parentId?: string;
  isActive: boolean;
  estimatedResolutionTime?: number; // hours
  autoAssignTeam?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'agent' | 'system';
  isInternal: boolean;
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TicketMetadata {
  source: 'web' | 'email' | 'api' | 'chat';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
  previousTickets?: string[];
  relatedResources?: RelatedResource[];
  customFields?: Record<string, any>;
}

export interface RelatedResource {
  type: 'article' | 'thread' | 'submission' | 'user';
  id: string;
  title: string;
  url: string;
}

// Ticket Creation and Updates
export interface CreateTicketData {
  title: string;
  description: string;
  categoryId: string;
  priority: Ticket['priority'];
  tags?: string[];
  attachments?: File[];
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: Ticket['priority'];
  status?: Ticket['status'];
  tags?: string[];
  assignedToId?: string;
}

export interface CreateMessageData {
  content: string;
  isInternal?: boolean;
  attachments?: File[];
}

// Support Filters
export interface TicketFilters {
  search?: string;
  status?: Ticket['status'][];
  priority?: Ticket['priority'][];
  category?: string[];
  assignedTo?: string[];
  createdBy?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'created' | 'updated' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Support Analytics
export interface SupportAnalytics {
  tickets: {
    total: number;
    open: number;
    resolved: number;
    averageResolutionTime: number; // hours
    firstResponseTime: number; // hours
  };
  satisfaction: {
    averageRating: number;
    totalRatings: number;
    distribution: Record<number, number>; // rating -> count
  };
  agents: {
    totalAgents: number;
    activeAgents: number;
    averageTicketsPerAgent: number;
    topPerformers: AgentPerformance[];
  };
  categories: CategoryAnalytics[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsResolved: number;
  averageResolutionTime: number;
  satisfactionRating: number;
  responseTime: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  ticketsCount: number;
  averageResolutionTime: number;
  resolutionRate: number;
  topIssues: string[];
}

// Help and Knowledge Base
export interface HelpArticle {
  id: string;
  title: string;
  content: string; // MDX
  summary: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  isHelpful?: boolean;
  lastUpdated: string;
  createdAt: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  parentId?: string;
  articleCount: number;
  isVisible: boolean;
  sortOrder: number;
}

// Chatbot
export interface ChatbotMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    relatedArticles?: HelpArticle[];
    needsHuman?: boolean;
    confidence?: number;
  };
}

export interface ChatbotSession {
  id: string;
  userId?: string;
  messages: ChatbotMessage[];
  status: 'active' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotIntent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
}

// Support Templates
export interface SupportTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// SLA (Service Level Agreement)
export interface SLA {
  id: string;
  name: string;
  description: string;
  priority: Ticket['priority'];
  firstResponseTime: number; // hours
  resolutionTime: number; // hours
  businessHoursOnly: boolean;
  isActive: boolean;
}

// Support Queue
export interface SupportQueue {
  id: string;
  name: string;
  description: string;
  tickets: Ticket[];
  agents: SupportAgent[];
  rules: QueueRule[];
  isActive: boolean;
}

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  currentTickets: number;
  maxTickets: number;
  skills: string[];
  languages: string[];
}

export interface QueueRule {
  id: string;
  condition: string;
  action: 'assign' | 'prioritize' | 'tag' | 'notify';
  value: any;
  isActive: boolean;
}

// Customer Satisfaction
export interface SatisfactionSurvey {
  id: string;
  ticketId: string;
  rating: number; // 1-5
  comment?: string;
  questions: SurveyQuestion[];
  submittedAt: string;
}

export interface SurveyQuestion {
  question: string;
  type: 'rating' | 'text' | 'choice';
  answer: any;
  required: boolean;
}