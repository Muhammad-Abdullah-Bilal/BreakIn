import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Sprint } from '../types/sprint';

interface SprintUpdate {
  type: 'task_updated' | 'task_created' | 'task_deleted' | 'sprint_updated';
  payload: any;
  timestamp: string;
  userId?: string;
}

interface UseSprintRealtimeReturn {
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  taskUpdates: SprintUpdate[];
  sprintUpdate: Sprint | null;
  connectionError: string | null;
  emit: (event: string, data: any) => void;
}

export function useSprintRealtime(sprintId: string): UseSprintRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [taskUpdates, setTaskUpdates] = useState<SprintUpdate[]>([]);
  const [sprintUpdate, setSprintUpdate] = useState<Sprint | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // If already connected or connecting, don't create new connection
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Create WebSocket connection
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/sprint/${sprintId}`;
      const ws = new WebSocket(wsUrl);
      
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`Connected to sprint ${sprintId} real-time updates`);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Send authentication if needed
        const token = localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const update: SprintUpdate = JSON.parse(event.data);
          
          switch (update.type) {
            case 'task_updated':
            case 'task_created':
            case 'task_deleted':
              setTaskUpdates(prev => [...prev.slice(-9), update]); // Keep last 10 updates
              break;
              
            case 'sprint_updated':
              setSprintUpdate(update.payload);
              break;
              
            default:
              console.log('Unknown update type:', update.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a deliberate close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`Attempting to reconnect in ${timeout}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, timeout);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [sprintId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Deliberate disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setTaskUpdates([]);
    setSprintUpdate(null);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: event,
        payload: data,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-reconnect on sprintId change
  useEffect(() => {
    if (sprintId) {
      disconnect();
      // Small delay to ensure cleanup before reconnecting
      const timer = setTimeout(connect, 100);
      return () => clearTimeout(timer);
    }
  }, [sprintId, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    taskUpdates,
    sprintUpdate,
    connectionError,
    emit
  };
}

// Hook for optimistic updates
export function useOptimisticTask() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Task>>>(new Map());

  const addOptimisticUpdate = useCallback((taskId: string, update: Partial<Task>) => {
    setOptimisticUpdates(prev => new Map(prev.set(taskId, { ...prev.get(taskId), ...update })));
  }, []);

  const removeOptimisticUpdate = useCallback((taskId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  }, []);

  const getOptimisticTask = useCallback((task: Task): Task => {
    const optimisticUpdate = optimisticUpdates.get(task.id);
    return optimisticUpdate ? { ...task, ...optimisticUpdate } : task;
  }, [optimisticUpdates]);

  return {
    addOptimisticUpdate,
    removeOptimisticUpdate,
    getOptimisticTask,
    hasOptimisticUpdates: optimisticUpdates.size > 0
  };
}
