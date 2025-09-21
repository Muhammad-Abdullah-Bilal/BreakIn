/**
 * Centralized API Client for connecting Frontend (Vercel) to Backend (Railway)
 * This client handles all communication between frontend and backend services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      const data = await response.json();
      
      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || data.error || 'Unknown error',
        message: data.message,
        status: response.status,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 500,
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: 'developer' | 'mentor' | 'company';
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Sprint endpoints
  async getSprintData(sprintId: string) {
    return this.request(`/sprint/${sprintId}`);
  }

  async createSprint(sprintData: any) {
    return this.request('/sprint', {
      method: 'POST',
      body: JSON.stringify(sprintData),
    });
  }

  async updateSprint(sprintId: string, updates: any) {
    return this.request(`/sprint/${sprintId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Feedback endpoints
  async submitFeedback(feedbackData: any) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async getFeedback(sprintId: string) {
    return this.request(`/feedback/${sprintId}`);
  }

  // Evaluation endpoints
  async evaluateSprint(evaluationData: any) {
    return this.request('/evaluation/evaluate', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  }

  async getEvaluation(sprintId: string) {
    return this.request(`/evaluation/${sprintId}`);
  }

  // User management
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateUserProfile(userId: string, profileData: any) {
    return this.request(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Activities (for the route that was failing)
  async getActivities() {
    return this.request('/api/activities');
  }

  async getDevelopers() {
    return this.request('/api/developers');
  }

  async getDeveloper(id: string) {
    return this.request(`/api/developers/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Employer endpoints (if using employer features)
  async getJobPostings() {
    return this.request('/api/v1/jobs');
  }

  async createJobPosting(jobData: any) {
    return this.request('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  // Agent endpoints (if using AI agents)
  async getAgents() {
    return this.request('/api/v1/agents');
  }

  async runAgent(agentId: string, input: any) {
    return this.request(`/api/v1/agents/${agentId}/run`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // WebSocket connection helper
  createWebSocketConnection(endpoint: string): WebSocket | null {
    try {
      const wsUrl = this.baseURL.replace('http', 'ws').replace('https', 'wss');
      return new WebSocket(`${wsUrl}${endpoint}`);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse };