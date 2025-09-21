import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types/sprint';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TaskFormProps {
  sprintId: string;
  initialStatus: TaskStatus;
  initialTask?: Partial<Task>;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ 
  sprintId, 
  initialStatus, 
  initialTask, 
  onSubmit, 
  onCancel 
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    priority: initialTask?.priority || TaskPriority.MEDIUM,
    status: initialTask?.status || initialStatus,
    assignedTo: initialTask?.assignedTo || null,
    dueDate: initialTask?.dueDate ? 
      new Date(initialTask.dueDate).toISOString().split('T')[0] : '',
    estimatedHours: initialTask?.estimatedHours || '',
    tags: initialTask?.tags || []
  });
  
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Estimated hours must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        sprintId,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        tags: formData.tags.filter(tag => tag.trim()),
        comments: []
      };
      
      await onSubmit(taskData);
    } catch (error) {
      console.error('Failed to submit task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {initialTask ? 'Edit Task' : 'Create New Task'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 ${
              errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter task title..."
            autoFocus
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
            rows={3}
            placeholder="Enter task description..."
          />
        </div>

        {/* Row 1: Priority and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: e.target.value as TaskPriority 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.CRITICAL}>Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                status: e.target.value as TaskStatus 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
            >
              <option value={TaskStatus.BACKLOG}>Backlog</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.REVIEW}>Review</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>
        </div>

        {/* Row 2: Assignee and Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <input
              type="text"
              value={formData.assignedTo || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                assignedTo: e.target.value || null 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
              placeholder="Enter assignee name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium mb-1">Estimated Hours</label>
          <input
            type="number"
            value={formData.estimatedHours}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 ${
              errors.estimatedHours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            min="0"
            step="0.5"
            placeholder="0"
          />
          {errors.estimatedHours && (
            <p className="text-red-500 text-xs mt-1">{errors.estimatedHours}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
              placeholder="Enter tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Tag List */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSubmitting ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
