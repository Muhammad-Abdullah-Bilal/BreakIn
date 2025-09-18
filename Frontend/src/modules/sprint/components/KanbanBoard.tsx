import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Task, TaskStatus, TaskPriority } from '../types/sprint';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useSprintRealtime } from '../hooks/useSprintRealtime';
import { PlusIcon } from '@heroicons/react/24/outline';

interface KanbanBoardProps {
  sprintId: string;
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  readonly?: boolean;
}

const COLUMN_CONFIG = {
  [TaskStatus.BACKLOG]: {
    title: 'Backlog',
    color: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  [TaskStatus.TODO]: {
    title: 'To Do',
    color: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  [TaskStatus.IN_PROGRESS]: {
    title: 'In Progress',
    color: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  [TaskStatus.REVIEW]: {
    title: 'Review',
    color: 'bg-purple-100 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  [TaskStatus.DONE]: {
    title: 'Done',
    color: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300'
  }
};

export function KanbanBoard({
  sprintId,
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  readonly = false
}: KanbanBoardProps) {
  const [showTaskForm, setShowTaskForm] = useState<TaskStatus | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Real-time updates
  const { 
    connect, 
    disconnect, 
    taskUpdates,
    isConnected 
  } = useSprintRealtime(sprintId);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Handle real-time task updates
  useEffect(() => {
    if (taskUpdates.length > 0) {
      // Apply optimistic updates from real-time events
      taskUpdates.forEach(update => {
        // This would trigger parent component to update task list
        console.log('Real-time task update:', update);
      });
    }
  }, [taskUpdates]);

  const getTasksByColumn = useCallback((status: TaskStatus) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        // Sort by priority (higher priority first), then by creation date
        const priorityOrder = {
          [TaskPriority.CRITICAL]: 4,
          [TaskPriority.HIGH]: 3,
          [TaskPriority.MEDIUM]: 2,
          [TaskPriority.LOW]: 1
        };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [tasks]);

  const handleDragStart = useCallback((result: any) => {
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    setDraggedTask(task || null);
  }, [tasks]);

  const handleDragEnd = useCallback(async (result: any) => {
    setDraggedTask(null);
    
    if (!result.destination || readonly) {
      return;
    }

    const { draggableId, source, destination } = result;
    
    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId as TaskStatus;
    
    try {
      // Optimistic update
      await onTaskUpdate(taskId, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // TODO: Show error notification
    }
  }, [onTaskUpdate, readonly]);

  const handleCreateTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await onTaskCreate(taskData);
      setShowTaskForm(null);
    } catch (error) {
      console.error('Failed to create task:', error);
      // TODO: Show error notification
    }
  }, [onTaskCreate]);

  const renderColumn = (status: TaskStatus) => {
    const config = COLUMN_CONFIG[status];
    const columnTasks = getTasksByColumn(status);
    
    return (
      <div key={status} className="flex flex-col h-full min-w-[280px]">
        <div className={`rounded-t-lg p-3 ${config.color} border-b`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${config.textColor}`}>
              {config.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${config.textColor} opacity-70`}>
                {columnTasks.length}
              </span>
              {!readonly && (
                <button
                  onClick={() => setShowTaskForm(status)}
                  className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 ${config.textColor}`}
                  title="Add task"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <Droppable droppableId={status} isDropDisabled={readonly}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
                snapshot.isDraggingOver 
                  ? 'bg-blue-50 dark:bg-blue-900/10' 
                  : 'bg-gray-50 dark:bg-gray-900/50'
              }`}
            >
              {columnTasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={index}
                  isDragDisabled={readonly}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`transition-transform ${
                        snapshot.isDragging ? 'rotate-2 scale-105' : ''
                      }`}
                    >
                      <TaskCard
                        task={task}
                        onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                        onDelete={() => onTaskDelete(task.id)}
                        readonly={readonly}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Task creation form */}
              {showTaskForm === status && (
                <div className="mt-2">
                  <TaskForm
                    sprintId={sprintId}
                    initialStatus={status}
                    onSubmit={handleCreateTask}
                    onCancel={() => setShowTaskForm(null)}
                  />
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold">Sprint Board</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
          {Object.values(TaskStatus).map(renderColumn)}
        </div>
      </DragDropContext>

      {/* Dragging feedback */}
      {draggedTask && (
        <div className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-lg shadow-lg z-50">
          Moving: {draggedTask.title}
        </div>
      )}
    </div>
  );
}
