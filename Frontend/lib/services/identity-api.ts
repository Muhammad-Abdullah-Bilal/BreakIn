// Comprehensive Service Layer for Identity Platform
// Implements all frozen contracts for API communication

import { 
  User, 
  Session, 
  Profile, 
  Badge, 
  ReputationPoint,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  PasswordReset,
  EmailVerification,
  OAuthStartResponse,
  OAuthCallbackData,
  OnboardingStep
} from '@/lib/types/auth';

import {
  Post,
  Thread,
  Reply,
  Tag,
  Vote,
  VoteAction,
  CreatePostData,
  CreateThreadData,
  CreateReplyData,
  CreateModerationFlagData,
  PostFilters,
  ThreadFilters,
  PaginatedResponse
} from '@/lib/types/community';

import {
  Article,
  ArticleCategory,
  ArticleFilters,
  SearchResult,
  SearchResponse,
  ArticleVote,
  ArticleBookmark,
  KnowledgeNavigation
} from '@/lib/types/content';

import {
  KPI,
  CohortMetric,
  KPIResponse,
  CohortResponse,
  AnalyticsFilters,
  CohortFilters
} from '@/lib/types/analytics';

import {
  AdminSetting,
  AuditLogEntry,
  ModerationQueueItem,
  ModerationAction,
  AdminDashboardStats,
  UserBan,
  AdminFilters,
  ModerationFilters
} from '@/lib/types/admin';

import {
  Ticket,
  TicketCategory,
  CreateTicketData,
  CreateMessageData,
  TicketFilters,
  SupportAnalytics,
  HelpArticle,
  ChatbotSession,
  ChatbotMessage
} from '@/lib/types/support';

// Base API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_TIMEOUT = 30000;

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Base API Client
class BaseAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || 'Request failed',
        response.status,
        errorData.code || 'UNKNOWN_ERROR',
        errorData.field
      );
    }

    return response.json();
  }

  protected get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, signal);
  }

  protected post<T>(endpoint: string, data?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      signal
    );
  }

  protected put<T>(endpoint: string, data?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      signal
    );
  }

  protected patch<T>(endpoint: string, data?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      signal
    );
  }

  protected delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, signal);
  }

  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    signal?: AbortSignal
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || 'Upload failed',
        response.status,
        errorData.code || 'UPLOAD_ERROR'
      );
    }

    return response.json();
  }
}

// Auth Service - Frozen Contract Implementation
export class AuthService extends BaseAPIClient {
  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<{ user: User; session: Session }> {
    return this.post('/auth/login', credentials, signal);
  }

  async signup(credentials: SignupCredentials, signal?: AbortSignal): Promise<{ user: User; session: Session }> {
    return this.post('/auth/signup', credentials, signal);
  }

  async oauthStart(provider: string, signal?: AbortSignal): Promise<OAuthStartResponse> {
    return this.post('/auth/oauth/start', { provider }, signal);
  }

  async oauthCallback(data: OAuthCallbackData, signal?: AbortSignal): Promise<{ user: User; session: Session }> {
    return this.post('/auth/oauth/callback', data, signal);
  }

  async logout(signal?: AbortSignal): Promise<void> {
    return this.post('/auth/logout', undefined, signal);
  }

  async refresh(signal?: AbortSignal): Promise<{ session: Session }> {
    return this.post('/auth/refresh', undefined, signal);
  }

  async requestReset(data: PasswordResetRequest, signal?: AbortSignal): Promise<void> {
    return this.post('/auth/request-reset', data, signal);
  }

  async reset(data: PasswordReset, signal?: AbortSignal): Promise<void> {
    return this.post('/auth/reset', data, signal);
  }

  async verifyEmail(data: EmailVerification, signal?: AbortSignal): Promise<void> {
    return this.post('/auth/verify-email', data, signal);
  }

  async getCurrentUser(signal?: AbortSignal): Promise<User> {
    return this.get('/auth/me', signal);
  }
}

// Onboarding Service
export class OnboardingService extends BaseAPIClient {
  async getSteps(signal?: AbortSignal): Promise<OnboardingStep[]> {
    return this.get('/onboarding/steps', signal);
  }

  async saveStep(stepId: string, data: Record<string, any>, signal?: AbortSignal): Promise<OnboardingStep> {
    return this.post(`/onboarding/steps/${stepId}`, data, signal);
  }

  async complete(signal?: AbortSignal): Promise<{ user: User }> {
    return this.post('/onboarding/complete', undefined, signal);
  }
}

// Profile Service
export class ProfileService extends BaseAPIClient {
  async get(userId?: string, signal?: AbortSignal): Promise<Profile> {
    const endpoint = userId ? `/profile/${userId}` : '/profile/me';
    return this.get(endpoint, signal);
  }

  async update(data: Partial<Profile>, signal?: AbortSignal): Promise<Profile> {
    return this.patch('/profile/me', data, signal);
  }

  async uploadAvatar(file: File, signal?: AbortSignal): Promise<{ avatarUrl: string }> {
    return this.uploadFile('/profile/avatar', file, undefined, signal);
  }
}

// Badges Service
export class BadgesService extends BaseAPIClient {
  async list(userId?: string, signal?: AbortSignal): Promise<Badge[]> {
    const endpoint = userId ? `/badges/${userId}` : '/badges/me';
    return this.get(endpoint, signal);
  }
}

// Reputation Service
export class ReputationService extends BaseAPIClient {
  async getSeries(userId?: string, timeframe?: string, signal?: AbortSignal): Promise<ReputationPoint[]> {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    
    const endpoint = userId 
      ? `/reputation/${userId}?${params.toString()}`
      : `/reputation/me?${params.toString()}`;
    
    return this.get(endpoint, signal);
  }
}

// Feed Service
export class FeedService extends BaseAPIClient {
  async listPosts(filters?: PostFilters, page = 1, pageSize = 20, signal?: AbortSignal): Promise<PaginatedResponse<Post>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/feed/posts?${params.toString()}`, signal);
  }

  async createPost(data: CreatePostData, signal?: AbortSignal): Promise<Post> {
    return this.post('/feed/posts', data, signal);
  }

  async likePost(postId: string, signal?: AbortSignal): Promise<void> {
    return this.post(`/feed/posts/${postId}/like`, undefined, signal);
  }

  async vote(action: VoteAction, signal?: AbortSignal): Promise<Vote> {
    return this.post('/feed/vote', action, signal);
  }

  async listTags(signal?: AbortSignal): Promise<Tag[]> {
    return this.get('/feed/tags', signal);
  }
}

// Forum Service
export class ForumService extends BaseAPIClient {
  async listThreads(filters?: ThreadFilters, page = 1, pageSize = 20, signal?: AbortSignal): Promise<PaginatedResponse<Thread>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/forum/threads?${params.toString()}`, signal);
  }

  async getThread(threadId: string, signal?: AbortSignal): Promise<Thread> {
    return this.get(`/forum/threads/${threadId}`, signal);
  }

  async createThread(data: CreateThreadData, signal?: AbortSignal): Promise<Thread> {
    return this.post('/forum/threads', data, signal);
  }

  async reply(threadId: string, data: CreateReplyData, signal?: AbortSignal): Promise<Reply> {
    return this.post(`/forum/threads/${threadId}/replies`, data, signal);
  }

  async vote(action: VoteAction, signal?: AbortSignal): Promise<Vote> {
    return this.post('/forum/vote', action, signal);
  }

  async flag(data: CreateModerationFlagData, signal?: AbortSignal): Promise<void> {
    return this.post('/forum/flag', data, signal);
  }
}

// Content Service
export class ContentService extends BaseAPIClient {
  async listArticles(filters?: ArticleFilters, page = 1, pageSize = 20, signal?: AbortSignal): Promise<PaginatedResponse<Article>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/content/articles?${params.toString()}`, signal);
  }

  async getArticle(articleId: string, signal?: AbortSignal): Promise<Article> {
    return this.get(`/content/articles/${articleId}`, signal);
  }

  async search(query: string, filters?: any, signal?: AbortSignal): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      });
    }

    return this.get(`/content/search?${params.toString()}`, signal);
  }

  async voteArticle(action: ArticleVote, signal?: AbortSignal): Promise<void> {
    return this.post('/content/vote', action, signal);
  }

  async bookmarkArticle(action: ArticleBookmark, signal?: AbortSignal): Promise<void> {
    return this.post('/content/bookmark', action, signal);
  }

  async getNavigation(signal?: AbortSignal): Promise<KnowledgeNavigation> {
    return this.get('/content/navigation', signal);
  }
}

// Analytics Service
export class AnalyticsService extends BaseAPIClient {
  async getKPIs(filters?: AnalyticsFilters, signal?: AbortSignal): Promise<KPIResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    return this.get(`/analytics/kpis?${params.toString()}`, signal);
  }

  async getCohorts(filters?: CohortFilters, signal?: AbortSignal): Promise<CohortResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    return this.get(`/analytics/cohorts?${params.toString()}`, signal);
  }
}

// Admin Service
export class AdminService extends BaseAPIClient {
  async getSettings(signal?: AbortSignal): Promise<AdminSetting[]> {
    return this.get('/admin/settings', signal);
  }

  async updateSettings(settings: Record<string, any>, signal?: AbortSignal): Promise<AdminSetting[]> {
    return this.patch('/admin/settings', settings, signal);
  }

  async listAudit(filters?: AdminFilters, page = 1, pageSize = 50, signal?: AbortSignal): Promise<PaginatedResponse<AuditLogEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/admin/audit?${params.toString()}`, signal);
  }

  async getDashboardStats(signal?: AbortSignal): Promise<AdminDashboardStats> {
    return this.get('/admin/dashboard', signal);
  }
}

// Moderation Service
export class ModerationService extends BaseAPIClient {
  async listFlags(filters?: ModerationFilters, page = 1, pageSize = 20, signal?: AbortSignal): Promise<PaginatedResponse<ModerationQueueItem>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/moderation/flags?${params.toString()}`, signal);
  }

  async resolveFlag(flagId: string, action: ModerationAction, signal?: AbortSignal): Promise<void> {
    return this.post(`/moderation/flags/${flagId}/resolve`, action, signal);
  }

  async banUser(userId: string, data: { reason: string; duration?: number; type: 'temporary' | 'permanent' }, signal?: AbortSignal): Promise<UserBan> {
    return this.post(`/moderation/users/${userId}/ban`, data, signal);
  }
}

// Support Service
export class SupportService extends BaseAPIClient {
  async listTickets(filters?: TicketFilters, page = 1, pageSize = 20, signal?: AbortSignal): Promise<PaginatedResponse<Ticket>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    });

    return this.get(`/support/tickets?${params.toString()}`, signal);
  }

  async getTicket(ticketId: string, signal?: AbortSignal): Promise<Ticket> {
    return this.get(`/support/tickets/${ticketId}`, signal);
  }

  async createTicket(data: CreateTicketData, signal?: AbortSignal): Promise<Ticket> {
    return this.post('/support/tickets', data, signal);
  }

  async replyTicket(ticketId: string, data: CreateMessageData, signal?: AbortSignal): Promise<void> {
    return this.post(`/support/tickets/${ticketId}/messages`, data, signal);
  }

  async getCategories(signal?: AbortSignal): Promise<TicketCategory[]> {
    return this.get('/support/categories', signal);
  }

  async getAnalytics(signal?: AbortSignal): Promise<SupportAnalytics> {
    return this.get('/support/analytics', signal);
  }

  async getHelpArticles(categoryId?: string, signal?: AbortSignal): Promise<HelpArticle[]> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.get(`/support/help${params}`, signal);
  }

  async getChatbotSession(sessionId?: string, signal?: AbortSignal): Promise<ChatbotSession> {
    const endpoint = sessionId ? `/support/chatbot/${sessionId}` : '/support/chatbot/new';
    return this.get(endpoint, signal);
  }

  async sendChatbotMessage(sessionId: string, message: string, signal?: AbortSignal): Promise<ChatbotMessage> {
    return this.post(`/support/chatbot/${sessionId}/message`, { message }, signal);
  }
}

// Service Instances - Ready for injection
export const authService = new AuthService();
export const onboardingService = new OnboardingService();
export const profileService = new ProfileService();
export const badgesService = new BadgesService();
export const reputationService = new ReputationService();
export const feedService = new FeedService();
export const forumService = new ForumService();
export const contentService = new ContentService();
export const analyticsService = new AnalyticsService();
export const adminService = new AdminService();
export const moderationService = new ModerationService();
export const supportService = new SupportService();