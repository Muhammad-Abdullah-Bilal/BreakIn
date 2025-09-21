'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';

// Realtime event types as per frozen contracts
export interface RealtimeEvent {
  id: string;
  channel: string;
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

// Channel namespaces from frozen contracts
export enum ChannelNamespace {
  REVIEWS = 'reviews',
  PIPELINE = 'pipeline', 
  NOTIFICATIONS = 'notifications',
  FEED = 'feed',
  SPRINTS = 'sprints',
  MENTORSHIP = 'mentorship',
}

// Event types for each namespace
export const EventTypes = {
  reviews: ['created', 'updated', 'completed'],
  pipeline: ['moved', 'advanced', 'rejected'],
  notifications: ['created', 'cleared'],
  feed: ['post.created', 'comment.created'],
  sprints: ['task.created', 'task.updated', 'task.moved'],
  mentorship: ['session.scheduled', 'session.started', 'session.completed'],
} as const;

interface RealtimeState {
  isConnected: boolean;
  connectionError: string | null;
  subscribedChannels: Set<string>;
}

interface RealtimeContextType extends RealtimeState {
  subscribe: (channel: string, handler: (event: RealtimeEvent) => void) => () => void;
  unsubscribe: (channel: string) => void;
  publish: (channel: string, type: string, data: any) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, session } = useAuth();
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    connectionError: null,
    subscribedChannels: new Set(),
  });

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't connect if no user session
    if (!session?.token) {
      return;
    }

    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws`
        : 'ws://localhost:8000/ws';

      const ws = new WebSocket(`${wsUrl}?token=${session.token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Realtime connection established');
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }));
        reconnectAttemptsRef.current = 0;

        // Resubscribe to channels
        state.subscribedChannels.forEach(channel => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel,
          }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          
          // Call all handlers for this channel
          const handlers = handlersRef.current.get(realtimeEvent.channel);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(realtimeEvent);
              } catch (error) {
                console.error('Error in realtime event handler:', error);
              }
            });
          }
        } catch (error) {
          console.error('Failed to parse realtime event:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Realtime connection closed:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));

        // Attempt to reconnect unless deliberately closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('Realtime connection error:', error);
        setState(prev => ({
          ...prev,
          connectionError: 'Connection failed',
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        connectionError: 'Failed to connect',
      }));
    }
  }, [session, state.subscribedChannels]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionError: null,
    }));
  }, []);

  const subscribe = useCallback((channel: string, handler: (event: RealtimeEvent) => void) => {
    // Add handler to registry
    if (!handlersRef.current.has(channel)) {
      handlersRef.current.set(channel, new Set());
    }
    handlersRef.current.get(channel)!.add(handler);

    // Subscribe to channel if not already subscribed
    if (!state.subscribedChannels.has(channel)) {
      setState(prev => ({
        ...prev,
        subscribedChannels: new Set([...prev.subscribedChannels, channel]),
      }));

      // Send subscribe message if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          channel,
        }));
      }
    }

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(channel);
      if (handlers) {
        handlers.delete(handler);
        
        // If no more handlers, unsubscribe from channel
        if (handlers.size === 0) {
          handlersRef.current.delete(channel);
          unsubscribe(channel);
        }
      }
    };
  }, [state.subscribedChannels]);

  const unsubscribe = useCallback((channel: string) => {
    setState(prev => {
      const newChannels = new Set(prev.subscribedChannels);
      newChannels.delete(channel);
      return {
        ...prev,
        subscribedChannels: newChannels,
      };
    });

    // Send unsubscribe message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channel,
      }));
    }

    // Remove handlers
    handlersRef.current.delete(channel);
  }, []);

  const publish = useCallback(async (channel: string, type: string, data: any) => {
    const event: Omit<RealtimeEvent, 'id' | 'timestamp'> = {
      channel,
      type,
      data,
      userId: user?.id,
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'publish',
        ...event,
      }));
    } else {
      // Fallback to HTTP if WebSocket not available
      try {
        const response = await fetch('/api/realtime/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.token}`,
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error('Failed to publish event');
        }
      } catch (error) {
        console.error('Failed to publish realtime event:', error);
        throw error;
      }
    }
  }, [user, session]);

  // Auto-connect when user session is available
  useEffect(() => {
    if (session?.token && !wsRef.current) {
      connect();
    } else if (!session?.token && wsRef.current) {
      disconnect();
    }
  }, [session?.token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: RealtimeContextType = {
    ...state,
    subscribe,
    unsubscribe,
    publish,
    connect,
    disconnect,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Convenience hook for subscribing to specific channels
export function useRealtimeSubscription(
  channel: string,
  handler: (event: RealtimeEvent) => void,
  dependencies: React.DependencyList = []
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe(channel, handler);
    return unsubscribe;
  }, [channel, subscribe, ...dependencies]);
}

// Convenience hook for publishing events
export function useRealtimePublish() {
  const { publish } = useRealtime();
  
  return useCallback((channel: string, type: string, data: any) => {
    return publish(channel, type, data);
  }, [publish]);
}