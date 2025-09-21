"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, Sprint, SprintMetrics, TaskStatus } from '../../../../src/modules/sprint/types/sprint';
import { KanbanBoard } from '../../../../src/modules/sprint/components/KanbanBoard';
import { SprintMetricsCard } from '../../../../src/modules/sprint/components/SprintMetricsCard';
import { useSprintRealtime, useOptimisticTask } from '../../../../src/modules/sprint/hooks/useSprintRealtime';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  Cog6ToothIcon,
  UsersIcon,
  BellIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Mock API functions - these would be replaced with real API calls
const mockSprintAPI = {
  async getSprint(id: string): Promise<Sprint> {
    return {
      id,
      name: 'FinTech API Sprint',
      description: 'Build a comprehensive payment processing API with security and monitoring',
      status: 'IN_PROGRESS' as any,
      startDate: '2025-09-10T08:00:00Z',
      endDate: '2025-09-17T18:00:00Z',
      goals: [
        'Implement secure payment endpoints',
        'Add transaction monitoring',
        'Create API documentation',
        'Set up automated testing'
      ],
      createdBy: 'team-lead-1',
      createdAt: '2025-09-08T10:00:00Z',
      updatedAt: '2025-09-15T14:30:00Z'
    };
  },

  async getSprintTasks(sprintId: string): Promise<Task[]> {
    return [
      {
        id: 'task-1',
        title: 'Design Payment API Schema',
        description: 'Define OpenAPI specification for payment endpoints',
        status: TaskStatus.DONE,
        priority: 'HIGH' as any,
        assignedTo: 'dev-1',
        sprintId,
        dueDate: '2025-09-12T18:00:00Z',
        estimatedHours: 8,
        completedAt: '2025-09-11T16:00:00Z',
        tags: ['api', 'design', 'payments'],
        comments: [],
        createdAt: '2025-09-10T08:00:00Z',
        updatedAt: '2025-09-11T16:00:00Z'
      },
      {
        id: 'task-2',
        title: 'Implement Payment Endpoints',
        description: 'Create REST endpoints for processing payments',
        status: TaskStatus.IN_PROGRESS,
        priority: 'CRITICAL' as any,
        assignedTo: 'dev-2',
        sprintId,
        dueDate: '2025-09-16T18:00:00Z',
        estimatedHours: 16,
        tags: ['api', 'implementation', 'payments'],
        comments: [],
        createdAt: '2025-09-10T08:30:00Z',
        updatedAt: '2025-09-15T14:00:00Z'
      },
      {
        id: 'task-3',
        title: 'Add Transaction Validation',
        description: 'Implement validation rules for payment transactions',
        status: TaskStatus.TODO,
        priority: 'HIGH' as any,
        assignedTo: 'dev-3',
        sprintId,
        dueDate: '2025-09-17T12:00:00Z',
        estimatedHours: 6,
        tags: ['validation', 'security'],
        comments: [],
        createdAt: '2025-09-10T09:00:00Z',
        updatedAt: '2025-09-10T09:00:00Z'
      },
      {
        id: 'task-4',
        title: 'Set up Monitoring Dashboard',
        description: 'Configure monitoring for payment API performance',
        status: TaskStatus.BACKLOG,
        priority: 'MEDIUM' as any,
        assignedTo: null,
        sprintId,
        estimatedHours: 4,
        tags: ['monitoring', 'devops'],
        comments: [],
        createdAt: '2025-09-10T09:15:00Z',
        updatedAt: '2025-09-10T09:15:00Z'
      },
      {
        id: 'task-5',
        title: 'Write API Documentation',
        description: 'Create comprehensive API documentation with examples',
        status: TaskStatus.REVIEW,
        priority: 'MEDIUM' as any,
        assignedTo: 'dev-1',
        sprintId,
        dueDate: '2025-09-17T18:00:00Z',
        estimatedHours: 8,
        tags: ['documentation'],
        comments: [],
        createdAt: '2025-09-11T10:00:00Z',
        updatedAt: '2025-09-14T16:00:00Z'
      }
    ];
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Updating task:', taskId, updates);
    throw new Error('Not implemented'); // This would return the updated task
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Creating task:', task);
    throw new Error('Not implemented');
  },

  async deleteTask(taskId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Deleting task:', taskId);
    throw new Error('Not implemented');
  }
};

export default function SprintDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sprintId = params?.id as string;

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Real-time and optimistic updates
  const { isConnected, taskUpdates, emit } = useSprintRealtime(sprintId);
  const { 
    addOptimisticUpdate, 
    removeOptimisticUpdate, 
    getOptimisticTask 
  } = useOptimisticTask();

  // Load sprint data
  useEffect(() => {
    const loadSprintData = async () => {
      if (!sprintId) return;
      
      try {
        setLoading(true);
        const [sprintData, tasksData] = await Promise.all([
          mockSprintAPI.getSprint(sprintId),
          mockSprintAPI.getSprintTasks(sprintId)
        ]);
        
        setSprint(sprintData);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        console.error('Failed to load sprint data:', err);
        setError('Failed to load sprint data');
      } finally {
        setLoading(false);
      }
    };

    loadSprintData();
  }, [sprintId]);

  // Calculate metrics
  const metrics = useMemo((): SprintMetrics => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = tasks.filter(t => 
      t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG
    ).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Mock burndown data - in real app this would come from API
    const burndownChart = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      remainingTasks: Math.max(0, totalTasks - Math.floor((i + 1) * (completedTasks / 7))),
      completedTasks: Math.floor((i + 1) * (completedTasks / 7)),
      idealBurndown: Math.max(0, totalTasks - Math.floor((i + 1) * (totalTasks / 7)))
    }));

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercentage,
      averageCycleTime: 18, // Mock: 18 hours average
      burndownChart
    };
  }, [tasks]);

  // Apply optimistic updates to tasks
  const optimisticTasks = useMemo(() => {
    return tasks.map(getOptimisticTask);
  }, [tasks, getOptimisticTask]);

  // Handle task updates with optimistic UI
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Apply optimistic update immediately
      addOptimisticUpdate(taskId, updates);
      
      // Emit real-time update
      emit('task_update', { taskId, updates });
      
      // Make API call
      const updatedTask = await mockSprintAPI.updateTask(taskId, updates);
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ));
      
      // Remove optimistic update
      removeOptimisticUpdate(taskId);
      
    } catch (error) {
      console.error('Failed to update task:', error);
      removeOptimisticUpdate(taskId);
      // Show error notification
    }
  }, [addOptimisticUpdate, removeOptimisticUpdate, emit]);

  const handleTaskCreate = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await mockSprintAPI.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      emit('task_created', newTask);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [emit]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await mockSprintAPI.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      emit('task_deleted', { taskId });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [emit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading sprint dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Sprint not found'}</p>
          <button
            onClick={() => router.push('/sprints')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Sprints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sprint.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {sprint.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {new Date(sprint.startDate).toLocaleDateString()} - 
                  {new Date(sprint.endDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {tasks.filter(t => t.assignedTo).length} active developers
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* AI Assistant Toggle */}
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showAIAssistant
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/30'
                }`}
              >
                <SparklesIcon className="w-4 h-4" />
                AI Assistant
              </button>

              {/* Notifications */}
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>

              {/* Sprint Controls */}
              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                  <PlayIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-yellow-600 hover:text-yellow-700 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                  <PauseIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  <StopIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metrics Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SprintMetricsCard metrics={metrics} />
            
            {/* AI Assistant Panel */}
            {showAIAssistant && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-500" />
                  AI Assistant
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      💡 Consider splitting "Implement Payment Endpoints" into smaller tasks for better progress tracking.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      🎯 Sprint is 71% complete - on track to meet the deadline!
                    </p>
                  </div>
                  <button className="w-full py-2 px-3 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    Generate Task Suggestions
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Kanban Board */}
          <div className="lg:col-span-3">
            <KanbanBoard
              sprintId={sprintId}
              tasks={optimisticTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskCreate={handleTaskCreate}
              onTaskDelete={handleTaskDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
