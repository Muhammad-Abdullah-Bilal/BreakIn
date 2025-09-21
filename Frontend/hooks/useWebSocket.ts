import { useState, useEffect, useRef, useCallback } from 'react'

// Types for different notification types
export interface CandidateActivityNotification {
  type: 'candidate_activity'
  candidate_id: string
  candidate_name: string
  activity: 'application_submitted' | 'profile_updated' | 'sprint_completed' | 'interview_scheduled' | 'status_changed'
  details: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface AgentStatusNotification {
  type: 'agent_status'
  agent_id: string
  agent_name: string
  agent_type: 'job_radar' | 'talent_matching' | 'outreach'
  status: 'online' | 'offline' | 'processing' | 'error' | 'completed'
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface SystemNotification {
  type: 'system'
  level: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  action_required?: boolean
  action_url?: string
}

export interface InterviewNotification {
  type: 'interview'
  interview_id: string
  candidate_name: string
  interviewer: string
  event: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'feedback_submitted'
  scheduled_time?: string
  details: string
  timestamp: string
}

export interface SprintNotification {
  type: 'sprint'
  sprint_id: string
  sprint_name: string
  event: 'started' | 'completed' | 'submission_received' | 'deadline_approaching'
  participant_count?: number
  details: string
  timestamp: string
}

export type WebSocketNotification = 
  | CandidateActivityNotification 
  | AgentStatusNotification 
  | SystemNotification 
  | InterviewNotification 
  | SprintNotification

export interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastMessage: WebSocketNotification | null
  notifications: WebSocketNotification[]
  unreadCount: number
}

interface UseWebSocketOptions {
  url?: string
  reconnectAttempts?: number
  reconnectInterval?: number
  maxNotifications?: number
  autoConnect?: boolean
}

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  maxNotifications: 100,
  autoConnect: true
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    notifications: [],
    unreadCount: 0
  })
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const mountedRef = useRef(true)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    
    cleanup()
    
    setState(prev => ({ ...prev, connecting: true, error: null }))
    
    try {
      const ws = new WebSocket(opts.url)
      wsRef.current = ws
      
      ws.onopen = () => {
        if (!mountedRef.current) return
        
        console.log('WebSocket connected')
        reconnectAttemptsRef.current = 0
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null
        }))
        
        // Send authentication or initialization message if needed
        ws.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('auth_token') || 'demo_token',
          user_type: 'employer'
        }))
      }
      
      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        
        try {
          const notification: WebSocketNotification = JSON.parse(event.data)
          
          setState(prev => {
            const newNotifications = [notification, ...prev.notifications]
              .slice(0, opts.maxNotifications)
            
            return {
              ...prev,
              lastMessage: notification,
              notifications: newNotifications,
              unreadCount: prev.unreadCount + 1
            }
          })
          
          // Show browser notification for important events
          if ('Notification' in window && Notification.permission === 'granted') {
            showBrowserNotification(notification)
          }
          
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.onerror = (error) => {
        if (!mountedRef.current) return
        
        console.error('WebSocket error:', error)
        setState(prev => ({
          ...prev,
          error: 'Connection error occurred',
          connecting: false
        }))
      }
      
      ws.onclose = (event) => {
        if (!mountedRef.current) return
        
        console.log('WebSocket disconnected:', event.code, event.reason)
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }))
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < opts.reconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${opts.reconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect()
            }
          }, opts.reconnectInterval)
        } else if (reconnectAttemptsRef.current >= opts.reconnectAttempts) {
          setState(prev => ({
            ...prev,
            error: 'Failed to reconnect after multiple attempts'
          }))
        }
      }
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to establish connection'
      }))
    }
  }, [opts.url, opts.reconnectAttempts, opts.reconnectInterval, opts.maxNotifications, cleanup])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    cleanup()
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }))
  }, [cleanup])

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // Mark notifications as read
  const markAsRead = useCallback((notificationIds?: string[]) => {
    setState(prev => {
      if (!notificationIds) {
        // Mark all as read
        return {
          ...prev,
          unreadCount: 0
        }
      }
      
      // Mark specific notifications as read (implementation depends on notification structure)
      return {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - notificationIds.length)
      }
    })
  }, [])

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }))
  }, [])

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((notification: WebSocketNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      let title = ''
      let body = ''
      let icon = '/favicon.ico'
      
      switch (notification.type) {
        case 'candidate_activity':
          title = `${notification.candidate_name} - New Activity`
          body = notification.details
          break
        case 'agent_status':
          title = `${notification.agent_name} - Status Update`
          body = notification.message
          break
        case 'system':
          title = notification.title
          body = notification.message
          break
        case 'interview':
          title = `Interview ${notification.event}`
          body = `${notification.candidate_name} - ${notification.details}`
          break
        case 'sprint':
          title = `Sprint ${notification.event}`
          body = `${notification.sprint_name} - ${notification.details}`
          break
      }
      
      const browserNotification = new Notification(title, {
        body,
        icon,
        tag: `${notification.type}-${Date.now()}`,
        requireInteraction: notification.type === 'system' && (notification as SystemNotification).action_required
      })
      
      // Auto-close after 5 seconds unless action required
      if (!(notification.type === 'system' && (notification as SystemNotification).action_required)) {
        setTimeout(() => browserNotification.close(), 5000)
      }
    }
  }, [])

  // Filter notifications by type
  const getNotificationsByType = useCallback((type: WebSocketNotification['type']) => {
    return state.notifications.filter(n => n.type === type)
  }, [state.notifications])

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return state.notifications.filter(n => new Date(n.timestamp) > cutoff)
  }, [state.notifications])

  // Auto-connect on mount
  useEffect(() => {
    if (opts.autoConnect) {
      connect()
    }
    
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [opts.autoConnect, connect, cleanup])

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    markAsRead,
    clearNotifications,
    requestNotificationPermission,
    
    // Utilities
    getNotificationsByType,
    getRecentNotifications
  }
}

export default useWebSocket