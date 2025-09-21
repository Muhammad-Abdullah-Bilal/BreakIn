'use client';

import React, { useState } from 'react';
import { useNotifications, useNotificationStats } from '@/hooks/useNotifications';
import { NotificationItem, NotificationItemSkeleton } from './NotificationItem';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react';
import { AppNotification } from '@/lib/types/notifications';

interface NotificationListProps {
  onNotificationClick?: (notification: AppNotification) => void;
  maxHeight?: string;
  showFilters?: boolean;
  showBulkActions?: boolean;
}

export function NotificationList({
  onNotificationClick,
  maxHeight = "400px",
  showFilters = true,
  showBulkActions = true,
}: NotificationListProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  
  const {
    notifications,
    total,
    hasMore,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeletingNotification,
  } = useNotifications({
    unreadOnly: activeTab === 'unread',
    type: typeFilter || undefined,
    limit: 20,
  });

  const { data: stats } = useNotificationStats();

  const handleSelectNotification = (notificationId: string, selected: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (selected) {
      newSelected.add(notificationId);
    } else {
      newSelected.delete(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id));
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = () => {
    selectedNotifications.forEach(id => deleteNotification(id));
    setSelectedNotifications(new Set());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationItemSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Notifications
            {stats && (
              <Badge variant="secondary">
                {stats.unread} unread
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {showBulkActions && stats && stats.unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">
                  All ({total})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({stats?.unread || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="sprint_update">Sprint Updates</SelectItem>
                  <SelectItem value="review_request">Review Requests</SelectItem>
                  <SelectItem value="review_completed">Review Completed</SelectItem>
                  <SelectItem value="pipeline_status">Pipeline Status</SelectItem>
                  <SelectItem value="team_update">Team Updates</SelectItem>
                  <SelectItem value="mention">Mentions</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="deadline">Deadlines</SelectItem>
                  <SelectItem value="achievement">Achievements</SelectItem>
                </SelectContent>
              </Select>
              
              {typeFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {showBulkActions && selectedNotifications.size > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">
              {selectedNotifications.size} notification(s) selected
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkMarkAsRead}
                disabled={isMarkingAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark read
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeletingNotification}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div 
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight }}
        >
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No notifications found</p>
              {activeTab === 'unread' && (
                <p className="text-sm mt-1">All caught up! 🎉</p>
              )}
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="relative">
                {showBulkActions && (
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 z-10"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={onNotificationClick}
                  showActions={!showBulkActions}
                />
              </div>
            ))
          )}
          
          {hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" size="sm">
                Load more
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}