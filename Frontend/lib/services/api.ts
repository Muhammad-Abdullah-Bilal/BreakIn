import { 
  Sprint, 
  Task, 
  Submission, 
  Review, 
  FeedbackThread, 
  FeedbackComment, 
  MentorCalibration,
  SprintFilters,
  ReviewFilters,
  SubmissionFilters,
  PaginatedResponse,
  ApiResponse,
  ReviewRubric,
  ProofBadge
} from '@/lib/types/domain';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Sprint API Service
export class SprintService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/sprints${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Sprint API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Sprint CRUD operations
  static async list(filters: SprintFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Sprint>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
      ),
    });

    return this.request(`?${params}`);
  }

  static async get(sprintId: string): Promise<Sprint> {
    const response = await this.request<ApiResponse<Sprint>>(`/${sprintId}`);
    if (!response.success || !response.data) {
      throw new Error('Sprint not found');
    }
    return response.data;
  }

  static async create(sprintData: Partial<Sprint>): Promise<Sprint> {
    const response = await this.request<ApiResponse<Sprint>>('', {
      method: 'POST',
      body: JSON.stringify(sprintData),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create sprint');
    }
    return response.data;
  }

  static async update(sprintId: string, updates: Partial<Sprint>): Promise<Sprint> {
    const response = await this.request<ApiResponse<Sprint>>(`/${sprintId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update sprint');
    }
    return response.data;
  }

  static async join(sprintId: string): Promise<void> {
    await this.request(`/${sprintId}/join`, {
      method: 'POST',
    });
  }

  static async leave(sprintId: string): Promise<void> {
    await this.request(`/${sprintId}/leave`, {
      method: 'POST',
    });
  }

  // Task operations
  static async getTasks(sprintId: string): Promise<Task[]> {
    const response = await this.request<ApiResponse<Task[]>>(`/${sprintId}/tasks`);
    return response.data || [];
  }

  static async createTask(sprintId: string, taskData: Partial<Task>): Promise<Task> {
    const response = await this.request<ApiResponse<Task>>(`/${sprintId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create task');
    }
    return response.data;
  }

  static async updateTask(sprintId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.request<ApiResponse<Task>>(`/${sprintId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update task');
    }
    return response.data;
  }

  static async deleteTask(sprintId: string, taskId: string): Promise<void> {
    await this.request(`/${sprintId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  static async reorderTasks(sprintId: string, taskIds: string[]): Promise<void> {
    await this.request(`/${sprintId}/tasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    });
  }
}

// Submissions API Service
export class SubmissionService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/submissions${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Submission API error: ${response.statusText}`);
    }

    return response.json();
  }

  static async list(filters: SubmissionFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Submission>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
      ),
    });

    return this.request(`?${params}`);
  }

  static async get(submissionId: string): Promise<Submission> {
    const response = await this.request<ApiResponse<Submission>>(`/${submissionId}`);
    if (!response.success || !response.data) {
      throw new Error('Submission not found');
    }
    return response.data;
  }

  static async create(submissionData: Partial<Submission>): Promise<Submission> {
    const response = await this.request<ApiResponse<Submission>>('', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create submission');
    }
    return response.data;
  }

  static async update(submissionId: string, updates: Partial<Submission>): Promise<Submission> {
    const response = await this.request<ApiResponse<Submission>>(`/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update submission');
    }
    return response.data;
  }

  static async submit(submissionId: string): Promise<Submission> {
    const response = await this.request<ApiResponse<Submission>>(`/${submissionId}/submit`, {
      method: 'POST',
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to submit');
    }
    return response.data;
  }

  // File upload operations
  static async uploadFile(submissionId: string, file: File, onProgress?: (progress: number) => void): Promise<{ fileId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      const token = localStorage.getItem('auth_token');
      xhr.open('POST', `${API_BASE}/api/submissions/${submissionId}/files`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  static async getFileContent(submissionId: string, fileId: string): Promise<string> {
    const response = await this.request<{ content: string }>(`/${submissionId}/files/${fileId}/content`);
    return response.content;
  }
}

// Feedback API Service
export class FeedbackService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/feedback${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Feedback API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Thread operations
  static async getThreads(submissionId: string): Promise<FeedbackThread[]> {
    const response = await this.request<ApiResponse<FeedbackThread[]>>(`/threads?submissionId=${submissionId}`);
    return response.data || [];
  }

  static async createThread(threadData: Partial<FeedbackThread>): Promise<FeedbackThread> {
    const response = await this.request<ApiResponse<FeedbackThread>>('/threads', {
      method: 'POST',
      body: JSON.stringify(threadData),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create thread');
    }
    return response.data;
  }

  static async updateThread(threadId: string, updates: Partial<FeedbackThread>): Promise<FeedbackThread> {
    const response = await this.request<ApiResponse<FeedbackThread>>(`/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update thread');
    }
    return response.data;
  }

  static async resolveThread(threadId: string): Promise<FeedbackThread> {
    return this.updateThread(threadId, { status: 'resolved', resolvedAt: new Date() });
  }

  static async unresolveThread(threadId: string): Promise<FeedbackThread> {
    return this.updateThread(threadId, { status: 'open', resolvedAt: undefined });
  }

  // Comment operations
  static async addComment(threadId: string, commentData: Partial<FeedbackComment>): Promise<FeedbackComment> {
    const response = await this.request<ApiResponse<FeedbackComment>>(`/threads/${threadId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to add comment');
    }
    return response.data;
  }

  static async updateComment(threadId: string, commentId: string, updates: Partial<FeedbackComment>): Promise<FeedbackComment> {
    const response = await this.request<ApiResponse<FeedbackComment>>(`/threads/${threadId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update comment');
    }
    return response.data;
  }

  // Reaction operations
  static async addReaction(threadId: string, commentId: string, emoji: string): Promise<void> {
    await this.request(`/threads/${threadId}/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  static async removeReaction(threadId: string, commentId: string, emoji: string): Promise<void> {
    await this.request(`/threads/${threadId}/comments/${commentId}/reactions/${emoji}`, {
      method: 'DELETE',
    });
  }
}

// Reviews API Service
export class ReviewService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/reviews${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Review API error: ${response.statusText}`);
    }

    return response.json();
  }

  static async list(filters: ReviewFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Review>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
      ),
    });

    return this.request(`?${params}`);
  }

  static async get(reviewId: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}`);
    if (!response.success || !response.data) {
      throw new Error('Review not found');
    }
    return response.data;
  }

  static async claim(reviewId: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}/claim`, {
      method: 'POST',
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to claim review');
    }
    return response.data;
  }

  static async unclaim(reviewId: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}/unclaim`, {
      method: 'POST',
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to unclaim review');
    }
    return response.data;
  }

  static async start(reviewId: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}/start`, {
      method: 'POST',
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to start review');
    }
    return response.data;
  }

  static async complete(reviewId: string, rubric: ReviewRubric, summary: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ rubric, summary }),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to complete review');
    }
    return response.data;
  }

  static async reopen(reviewId: string, reason?: string): Promise<Review> {
    const response = await this.request<ApiResponse<Review>>(`/${reviewId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to reopen review');
    }
    return response.data;
  }

  // Get reviews assigned to current mentor
  static async getMyReviews(status?: Review['status'][]): Promise<Review[]> {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status.join(','));
    }
    params.set('assignedToMe', 'true');

    const response = await this.request<PaginatedResponse<Review>>(`?${params}`);
    return response.data;
  }
}

// Calibration API Service
export class CalibrationService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/calibration${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Calibration API error: ${response.statusText}`);
    }

    return response.json();
  }

  static async getMentorMetrics(mentorId: string): Promise<{
    totalReviews: number;
    averageScore: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    qualityScore: number;
    recentReviews: Review[];
  }> {
    const response = await this.request<ApiResponse<any>>(`/mentor/${mentorId}/metrics`);
    return response.data || {};
  }

  static async getRubricDistributions(): Promise<{
    criteria: string;
    distribution: Record<number, number>;
  }[]> {
    const response = await this.request<ApiResponse<any>>('/rubric-distributions');
    return response.data || [];
  }

  static async getRecentReviews(mentorId: string, limit = 10): Promise<Review[]> {
    const response = await this.request<ApiResponse<Review[]>>(`/mentor/${mentorId}/recent-reviews?limit=${limit}`);
    return response.data || [];
  }
}