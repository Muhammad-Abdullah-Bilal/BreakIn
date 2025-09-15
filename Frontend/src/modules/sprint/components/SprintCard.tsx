'use client';

import Link from 'next/link';
import React from 'react';
import { formatDate } from '../../core/utils/formatDate';
import { Sprint, SprintStatus } from '../types/sprint';

type SprintCardProps = {
  sprint: Sprint;
  className?: string;
};

export const SprintCard: React.FC<SprintCardProps> = ({ sprint, className = '' }) => {
  const getStatusBadgeClass = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case SprintStatus.IN_PROGRESS:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case SprintStatus.REVIEW:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case SprintStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case SprintStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const completedTasks = sprint.tasks?.filter(task => task.status === 'done').length || 0;
  const totalTasks = sprint.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm hover:shadow transition-all ${className}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2.5 py-0.5 text-xs font-medium rounded ${getStatusBadgeClass(sprint.status)}`}>
            {sprint.status.replace('_', ' ')}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDate(sprint.startDate, 'date')} - {formatDate(sprint.endDate, 'date')}
          </span>
        </div>
        
        <Link href={`/sprint/${sprint.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
            {sprint.name}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {sprint.description}
        </p>
        
        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 border-t border-border flex justify-between items-center">
        <div className="flex -space-x-2">
          {/* This would be a component to show avatars of team members */}
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
            +{3}
          </div>
        </div>
        
        <Link 
          href={`/sprint/${sprint.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};
