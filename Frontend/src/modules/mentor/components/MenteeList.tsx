import React, { useState } from 'react';
import { Mentee } from '../types/mentee';
import { MenteeCard } from './MenteeCard';

interface MenteeListProps {
  mentees: Mentee[];
  onSelectMentee: (mentee: Mentee) => void;
  loading?: boolean;
}

export function MenteeList({ mentees, onSelectMentee, loading = false }: MenteeListProps) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredMentees = mentees.filter(mentee => {
    // Apply status filter
    if (filter !== 'all' && mentee.status !== filter) {
      return false;
    }

    // Apply search filter (case insensitive)
    if (searchTerm && !mentee.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div 
            key={index} 
            className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 flex-col sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search mentees..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <select
            value={filter}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="onboarding">Onboarding</option>
          </select>
        </div>
      </div>

      {filteredMentees.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">No mentees found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMentees.map((mentee) => (
            <MenteeCard
              key={mentee.id}
              mentee={mentee}
              onSelect={onSelectMentee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
