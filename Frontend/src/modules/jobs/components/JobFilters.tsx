import React, { useState } from "react";
import { ExperienceLevel, JobFilter, JobType } from "../types/job";

interface JobFiltersProps {
  initialFilters?: JobFilter;
  onFilterChange: (filters: JobFilter) => void;
  className?: string;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  initialFilters = {},
  onFilterChange,
  className = "",
}) => {
  const [filters, setFilters] = useState<JobFilter>(initialFilters);
  const [expanded, setExpanded] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleJobTypeChange = (type: JobType) => {
    setFilters((prev) => {
      const currentTypes = prev.types || [];
      const updatedTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      
      return { ...prev, types: updatedTypes };
    });
  };

  const handleExperienceLevelChange = (level: ExperienceLevel) => {
    setFilters((prev) => {
      const currentLevels = prev.experienceLevels || [];
      const updatedLevels = currentLevels.includes(level)
        ? currentLevels.filter((l) => l !== level)
        : [...currentLevels, level];
      
      return { ...prev, experienceLevels: updatedLevels };
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters: JobFilter = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filters</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 dark:text-blue-400"
        >
          {expanded ? "Collapse" : "Expand"} filters
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic filters - always visible */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium mb-1">
            Search
          </label>
          <input
            type="text"
            id="keyword"
            name="keyword"
            value={filters.keyword || ""}
            onChange={handleInputChange}
            placeholder="Job title, skills, company..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={filters.location || ""}
            onChange={handleInputChange}
            placeholder="City, state, country..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRemote"
            name="isRemote"
            checked={filters.isRemote || false}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isRemote" className="ml-2 text-sm">
            Remote only
          </label>
        </div>

        {/* Advanced filters - visible when expanded */}
        {expanded && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(JobType).map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`type-${type}`}
                      checked={(filters.types || []).includes(type)}
                      onChange={() => handleJobTypeChange(type)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`type-${type}`} className="ml-2 text-sm">
                      {type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ExperienceLevel).map((level) => (
                  <div key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`level-${level}`}
                      checked={(filters.experienceLevels || []).includes(level)}
                      onChange={() => handleExperienceLevelChange(level)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`level-${level}`} className="ml-2 text-sm">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="minSalary" className="block text-sm font-medium mb-1">
                Minimum Salary
              </label>
              <input
                type="number"
                id="minSalary"
                name="minSalary"
                value={filters.minSalary || ""}
                onChange={handleInputChange}
                placeholder="Minimum annual salary"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="postedWithin" className="block text-sm font-medium mb-1">
                Posted Within
              </label>
              <select
                id="postedWithin"
                name="postedWithin"
                value={filters.postedWithin || ""}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>
            </div>
          </>
        )}

        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleApplyFilters}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
