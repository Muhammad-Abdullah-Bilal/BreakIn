import React from 'react';
import { SprintMetrics, BurndownPoint } from '../types/sprint';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

interface SprintMetricsCardProps {
  metrics: SprintMetrics;
  className?: string;
}

export function SprintMetricsCard({ metrics, className = '' }: SprintMetricsCardProps) {
  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    completionPercentage,
    averageCycleTime,
    burndownChart
  } = metrics;

  // Calculate trends
  const isOnTrack = completionPercentage >= 70; // Assuming 70% is good progress
  const cycleTimeText = averageCycleTime 
    ? averageCycleTime > 24 
      ? `${Math.round(averageCycleTime / 24)}d avg` 
      : `${Math.round(averageCycleTime)}h avg`
    : 'No data';

  // Simple burndown visualization (last 7 days)
  const recentBurndown = burndownChart?.slice(-7) || [];
  const isAheadOfSchedule = recentBurndown.length > 0 && 
    recentBurndown[recentBurndown.length - 1]?.remainingTasks < 
    recentBurndown[recentBurndown.length - 1]?.idealBurndown;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-500" />
          Sprint Metrics
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isOnTrack 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {isOnTrack ? 'On Track' : 'Needs Attention'}
        </div>
      </div>

      {/* Main Progress Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${completionPercentage}, 100`}
              className={`${
                completionPercentage >= 90 
                  ? 'text-green-500' 
                  : completionPercentage >= 70 
                    ? 'text-blue-500'
                    : completionPercentage >= 50
                      ? 'text-yellow-500'
                      : 'text-red-500'
              }`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {completedTasks}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ClockIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {inProgressTasks}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingTasks}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ChartBarIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {totalTasks}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="space-y-3 mb-6">
        {/* Cycle Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Avg Cycle Time</span>
          </div>
          <span className="text-sm font-bold">{cycleTimeText}</span>
        </div>

        {/* Burndown Status */}
        {isAheadOfSchedule !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              {isAheadOfSchedule ? (
                <TrendingDownIcon className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingUpIcon className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">Schedule</span>
            </div>
            <span className={`text-sm font-bold ${
              isAheadOfSchedule 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isAheadOfSchedule ? 'Ahead' : 'Behind'}
            </span>
          </div>
        )}
      </div>

      {/* Mini Burndown Chart */}
      {recentBurndown.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium mb-3">Recent Progress</h4>
          <div className="h-16 flex items-end justify-between gap-1">
            {recentBurndown.map((point, index) => {
              const height = Math.max(4, (point.remainingTasks / totalTasks) * 100);
              const isIdeal = point.remainingTasks <= point.idealBurndown;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isIdeal 
                        ? 'bg-green-400 dark:bg-green-500' 
                        : 'bg-red-400 dark:bg-red-500'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${point.remainingTasks} remaining (${new Date(point.date).toLocaleDateString()})`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>7d ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
        <button className="flex-1 py-2 px-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          View Details
        </button>
        <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Export Report
        </button>
      </div>
    </div>
  );
}
