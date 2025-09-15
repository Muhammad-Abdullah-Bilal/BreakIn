'use client';

import React from 'react';
import { Sprint, SprintStatus } from '../types/sprint';
import { SprintCard } from './SprintCard';

type SprintListProps = {
  sprints: Sprint[];
  isLoading?: boolean;
  error?: string;
  onFilterChange?: (filters: any) => void;
};

export const SprintList: React.FC<SprintListProps> = ({ 
  sprints, 
  isLoading = false, 
  error,
  onFilterChange 
}) => {
  const [statusFilter, setStatusFilter] = React.useState<SprintStatus | 'all'>('all');
  
  const filteredSprints = React.useMemo(() => {
    if (statusFilter === 'all') {
      return sprints;
    }
    return sprints.filter(sprint => sprint.status === statusFilter);
  }, [sprints, statusFilter]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SprintStatus | 'all';
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({ status: value === 'all' ? undefined : value });
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading sprints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-2 text-red-500 dark:bg-red-900/20 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-lg font-medium">Error loading sprints</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border rounded-lg">
        <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 text-blue-500 dark:bg-blue-900/20 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No sprints found</h3>
        <p className="text-muted-foreground mt-1">Get started by creating your first sprint.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Your Sprints</h2>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value={SprintStatus.PLANNING}>Planning</option>
            <option value={SprintStatus.IN_PROGRESS}>In Progress</option>
            <option value={SprintStatus.REVIEW}>Review</option>
            <option value={SprintStatus.COMPLETED}>Completed</option>
            <option value={SprintStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSprints.map(sprint => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </div>
    </div>
  );
};
