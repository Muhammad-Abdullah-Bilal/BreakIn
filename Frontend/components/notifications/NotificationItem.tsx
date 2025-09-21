'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppNotification } from '@/lib/types/notifications';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { X, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: AppNotification) => void;
  showActions?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
}: NotificationItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sprint_update':
        return '🏃';
      case 'review_request':
        return '👀';
      case 'review_completed':
        return '✅';
      case 'pipeline_status':
        return '🔧';
      case 'team_update':
        return '👥';
      case 'mention':
        return '@';
      case 'milestone':
        return '🎯';
      case 'system':
        return '⚙️';
      case 'security':
        return '🔒';
      case 'deadline':
        return '⏰';
      case 'achievement':
        return '🏆';
      default:
        return '📢';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:shadow-md cursor-pointer",
        !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Type Icon */}
            <div className="text-lg flex-shrink-0 mt-0.5">
              {getTypeIcon(notification.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={cn(
                  "text-sm font-medium leading-tight",
                  !notification.isRead && "font-semibold"
                )}>
                  {notification.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant={getPriorityColor(notification.priority)}
                    className="text-xs"
                  >
                    {notification.priority}
                  </Badge>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </span>
                
                {notification.metadata && (
                  <span className="text-xs text-muted-foreground">
                    {notification.type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.isRead && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="h-8 w-8 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Delete notification"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for notifications
export function NotificationItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-full" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}