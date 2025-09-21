'use client'

import React, { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Users, Zap, Calendar, Target, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWebSocket, WebSocketNotification } from '@/hooks/useWebSocket'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  className?: string
}

const getNotificationIcon = (type: WebSocketNotification['type']) => {
  switch (type) {
    case 'candidate_activity':
      return <Users className="h-4 w-4" />
    case 'agent_status':
      return <Zap className="h-4 w-4" />
    case 'interview':
      return <Calendar className="h-4 w-4" />
    case 'sprint':
      return <Target className="h-4 w-4" />
    case 'system':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getNotificationColor = (notification: WebSocketNotification) => {
  switch (notification.type) {
    case 'candidate_activity':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'agent_status':
      const agentNotification = notification as any
      if (agentNotification.status === 'error') return 'bg-red-50 border-red-200 text-red-800'
      if (agentNotification.status === 'completed') return 'bg-green-50 border-green-200 text-green-800'
      return 'bg-purple-50 border-purple-200 text-purple-800'
    case 'interview':
      return 'bg-orange-50 border-orange-200 text-orange-800'
    case 'sprint':
      return 'bg-indigo-50 border-indigo-200 text-indigo-800'
    case 'system':
      const systemNotification = notification as any
      if (systemNotification.level === 'error') return 'bg-red-50 border-red-200 text-red-800'
      if (systemNotification.level === 'warning') return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      if (systemNotification.level === 'success') return 'bg-green-50 border-green-200 text-green-800'
      return 'bg-gray-50 border-gray-200 text-gray-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

const NotificationItem: React.FC<{ 
  notification: WebSocketNotification
  onMarkAsRead?: () => void
  onAction?: () => void
}> = ({ notification, onMarkAsRead, onAction }) => {
  const colorClass = getNotificationColor(notification)
  const icon = getNotificationIcon(notification.type)
  
  const getTitle = () => {
    switch (notification.type) {
      case 'candidate_activity':
        const candidateNotif = notification as any
        return `${candidateNotif.candidate_name} - ${candidateNotif.activity.replace('_', ' ')}`
      case 'agent_status':
        const agentNotif = notification as any
        return `${agentNotif.agent_name} - ${agentNotif.status}`
      case 'interview':
        const interviewNotif = notification as any
        return `Interview ${interviewNotif.event} - ${interviewNotif.candidate_name}`
      case 'sprint':
        const sprintNotif = notification as any
        return `${sprintNotif.sprint_name} - ${sprintNotif.event}`
      case 'system':
        const systemNotif = notification as any
        return systemNotif.title
      default:
        return 'Notification'
    }
  }
  
  const getDetails = () => {
    switch (notification.type) {
      case 'candidate_activity':
        return (notification as any).details
      case 'agent_status':
        return (notification as any).message
      case 'interview':
        return (notification as any).details
      case 'sprint':
        return (notification as any).details
      case 'system':
        return (notification as any).message
      default:
        return ''
    }
  }
  
  const hasAction = notification.type === 'system' && (notification as any).action_url
  
  return (
    <div className={`p-3 rounded-lg border ${colorClass} mb-2`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">
                {getTitle()}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {getDetails()}
              </p>
              <p className="text-xs opacity-60 mt-1">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {hasAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={onAction}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={onMarkAsRead}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    connected,
    connecting,
    error,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    clearNotifications,
    getNotificationsByType,
    getRecentNotifications
  } = useWebSocket()
  
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // Auto-connect on mount if not connected
  useEffect(() => {
    if (!connected && !connecting && !error) {
      connect()
    }
  }, [connected, connecting, error, connect])
  
  const handleMarkAllAsRead = () => {
    markAsRead()
  }
  
  const handleClearAll = () => {
    clearNotifications()
  }
  
  const handleNotificationAction = (notification: WebSocketNotification) => {
    if (notification.type === 'system') {
      const systemNotif = notification as any
      if (systemNotif.action_url) {
        window.open(systemNotif.action_url, '_blank')
      }
    }
  }
  
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'candidates':
        return getNotificationsByType('candidate_activity')
      case 'agents':
        return getNotificationsByType('agent_status')
      case 'interviews':
        return getNotificationsByType('interview')
      case 'sprints':
        return getNotificationsByType('sprint')
      case 'system':
        return getNotificationsByType('system')
      case 'recent':
        return getRecentNotifications(24)
      default:
        return notifications
    }
  }
  
  const filteredNotifications = getFilteredNotifications()
  
  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96 p-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      connected ? 'bg-green-500' : 
                      connecting ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {connected ? 'Live' : connecting ? 'Connecting...' : 'Offline'}
                    </span>
                  </div>
                  {!connected && !connecting && (
                    <Button size="sm" variant="outline" onClick={connect}>
                      Reconnect
                    </Button>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {unreadCount} unread
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead}>
                    Mark all read
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleClearAll}>
                    Clear all
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-3 mx-3">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="candidates" className="text-xs">Candidates</TabsTrigger>
                  <TabsTrigger value="agents" className="text-xs">Agents</TabsTrigger>
                </TabsList>
                
                <TabsList className="grid w-full grid-cols-3 mb-3 mx-3">
                  <TabsTrigger value="interviews" className="text-xs">Interviews</TabsTrigger>
                  <TabsTrigger value="sprints" className="text-xs">Sprints</TabsTrigger>
                  <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-96 px-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                      <p className="text-xs">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNotifications.map((notification, index) => (
                        <NotificationItem
                          key={`${notification.type}-${notification.timestamp}-${index}`}
                          notification={notification}
                          onMarkAsRead={() => markAsRead([`${notification.type}-${notification.timestamp}`])}
                          onAction={() => handleNotificationAction(notification)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default NotificationCenter