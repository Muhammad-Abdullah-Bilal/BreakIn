import { AppNotification, NotificationStats, NotificationPreferences } from '@/lib/types/notifications';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class NotificationService {
  /**
   * Get all notifications for the current user
   */
  static async getNotifications(params: {
    page?: number;
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
  } = {}): Promise<{
    notifications: AppNotification[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.type) searchParams.set('type', params.type);
    if (params.unreadOnly) searchParams.set('unread_only', 'true');

    const response = await fetch(`${API_BASE}/api/notifications?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(): Promise<NotificationStats> {
    const response = await fetch(`${API_BASE}/api/notifications/stats`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification stats');
    }

    return response.json();
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/read-multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_ids: notificationIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear all notifications');
    }
  }

  /**
   * Get user notification preferences
   */
  static async getPreferences(): Promise<NotificationPreferences> {
    const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification preferences');
    }

    return response.json();
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Test notification (for development)
   */
  static async sendTestNotification(type: string, message: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }
  }

  /**
   * Get auth token from storage or auth provider
   */
  private static async getAuthToken(): Promise<string> {
    // This would integrate with your auth system
    // For now, return a placeholder
    return localStorage.getItem('auth_token') || '';
  }
}