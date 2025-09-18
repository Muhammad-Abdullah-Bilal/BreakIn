import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/sprint';
import { 
  ClockIcon, 
  UserIcon, 
  TagIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TaskCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
  onDelete: () => Promise<void>;
  readonly?: boolean;
  isDragging?: boolean;
}

const PRIORITY_CONFIG = {
  [TaskPriority.LOW]: {
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    icon: '🔵'
  },
  [TaskPriority.MEDIUM]: {
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: '🟡'
  },
  [TaskPriority.HIGH]: {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    icon: '🟠'
  },
  [TaskPriority.CRITICAL]: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    icon: '🔴'
  }
};

export function TaskCard({ 
  task, 
  onUpdate, 
  onDelete, 
  readonly = false,
  isDragging = false 
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isLoading, setIsLoading] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  
  const handleSaveEdit = async () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      setIsLoading(true);
      try {
        await onUpdate({ title: editedTitle.trim() });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update task:', error);
        setEditedTitle(task.title); // Revert on error
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditing(false);
      setEditedTitle(task.title);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(task.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  const isNearDue = task.dueDate && !isOverdue && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg border shadow-sm hover:shadow-md transition-all
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500/50' : ''}
        ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}
        ${isNearDue ? 'border-yellow-300 dark:border-yellow-700' : ''}
      `}
    >
      {/* Task Header */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Priority Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
            <span className="mr-1">{priorityConfig.icon}</span>
            {task.priority.toUpperCase()}
          </div>
          
          {/* Actions */}
          {!readonly && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-500 rounded"
                title="Edit task"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-500 rounded"
                title="Delete task"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Task Title */}
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-medium bg-transparent border-b border-blue-500 focus:outline-none"
            autoFocus
            disabled={isLoading}
          />
        ) : (
          <h4 
            className={`text-sm font-medium line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
              task.status === TaskStatus.DONE ? 'line-through text-gray-500 dark:text-gray-400' : ''
            }`}
            onClick={() => !readonly && setIsEditing(true)}
          >
            {task.title}
          </h4>
        )}

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Task Metadata */}
      <div className="px-3 pb-3 space-y-2">
        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${
            isOverdue 
              ? 'text-red-600 dark:text-red-400' 
              : isNearDue 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            {isOverdue ? (
              <ExclamationTriangleIcon className="w-3 h-3" />
            ) : task.status === TaskStatus.DONE ? (
              <CheckCircleIcon className="w-3 h-3" />
            ) : (
              <ClockIcon className="w-3 h-3" />
            )}
            {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && <span className="font-medium">(Overdue)</span>}
            {isNearDue && <span className="font-medium">(Due Soon)</span>}
          </div>
        )}

        {/* Estimated Hours */}
        {task.estimatedHours && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-3 h-3" />
            {task.estimatedHours}h estimated
          </div>
        )}

        {/* Assignee */}
        {task.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <UserIcon className="w-3 h-3" />
            {task.assignedTo}
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <TagIcon className="w-3 h-3" />
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{task.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Comments Count */}
        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftIcon className="w-3 h-3" />
            {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Completed Date */}
        {task.completedAt && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircleIcon className="w-3 h-3" />
            Completed {new Date(task.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Progress Indicator for In Progress Tasks */}
      {task.status === TaskStatus.IN_PROGRESS && (
        <div className="px-3 pb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: '60%' }} // This could be calculated based on task progress
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
