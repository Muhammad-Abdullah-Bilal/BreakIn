'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { NotificationService } from '@/lib/services/notification';
import { AppNotification, NotificationStats, NotificationPreferences } from '@/lib/types/notifications';
import { toast } from '@/components/ui/Toast';
import { useEffect } from 'react';

/**
 * Hook for managing notifications with real-time updates
 */
export function useNotifications(options: {
  page?: number;
  limit?: number;
  type?: string;
  unreadOnly?: boolean;
} = {}) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const queryClient = useQueryClient();

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribe('notifications', (data: any) => {
      if (data.type === 'notification_created') {
        // Add new notification to the list
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: [data.notification, ...old.notifications],
            total: old.total + 1,
          };
        });

        // Update stats
        queryClient.invalidateQueries({ queryKey: ['notification-stats'] });

        // Show toast for high priority notifications
        if (data.notification.priority === 'high' || data.notification.priority === 'urgent') {
          toast({
            title: data.notification.title,
            description: data.notification.message,
            variant: data.notification.priority === 'urgent' ? 'destructive' : 'default',
          });
        }
      } else if (data.type === 'notification_read') {
        // Update notification read status
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((notif: AppNotification) =>
              notif.id === data.notificationId ? { ...notif, isRead: true } : notif
            ),
          };
        });

        // Update stats
        queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      }
    });

    return unsubscribe;
  }, [user?.id, subscribe, queryClient]);

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', options],
    queryFn: () => NotificationService.getNotifications(options),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: NotificationService.markAsRead,
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((notif: AppNotification) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: NotificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((notif: AppNotification) => ({
            ...notif,
            isRead: true,
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: NotificationService.deleteNotification,
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.filter((notif: AppNotification) => notif.id !== notificationId),
          total: old.total - 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  return {
    notifications: notificationsData?.notifications || [],
    total: notificationsData?.total || 0,
    hasMore: notificationsData?.hasMore || false,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
}

/**
 * Hook for notification statistics
 */
export function useNotificationStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { subscribe } = useRealtime();

  // Subscribe to real-time stats updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribe('notifications', (data: any) => {
      if (data.type === 'notification_created' || data.type === 'notification_read') {
        queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      }
    });

    return unsubscribe;
  }, [user?.id, subscribe, queryClient]);

  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: NotificationService.getNotificationStats,
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: NotificationService.getPreferences,
    enabled: !!user,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: NotificationService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
}