// FeedbackForm: structured feedback (scores + notes)
import React, { useState } from 'react';
import { Feedback, FeedbackRubric } from '../types/feedback';
import { Review } from '../types/review';

interface FeedbackFormProps {
  submissionId: string;
  review?: Review;
  rubric?: FeedbackRubric;
  initialFeedback?: Partial<Feedback>;
  onSubmit: (feedback: Partial<Feedback>) => void;
  onSaveDraft?: (feedback: Partial<Feedback>) => void;
  onCancel?: () => void;
}

export function FeedbackForm({ 
  submissionId,
  review, 
  rubric, 
  initialFeedback, 
  onSubmit, 
  onSaveDraft,
  onCancel 
}: FeedbackFormProps) {
  const [feedback, setFeedback] = useState<Partial<Feedback>>(initialFeedback || {
    reviewId: review?.id,
    technical: 0,
    completeness: 0,
    communication: 0,
    comments: '',
    scores: {},
    strengths: [],
    improvements: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleScoreChange = (component: string, value: number) => {
    setFeedback(prev => ({
      ...prev,
      [component]: value
    }));

    // Clear validation error if exists
    if (errors[component]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[component];
        return newErrors;
      });
    }
  };

  const handleRubricScoreChange = (key: string, value: number) => {
    setFeedback(prev => ({
      ...prev,
      scores: {
        ...(prev.scores || {}),
        [key]: value
      }
    }));

    // Clear validation error if exists
    if (errors[`scores.${key}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`scores.${key}`];
        return newErrors;
      });
    }
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(prev => ({
      ...prev,
      comments: e.target.value
    }));

    // Clear validation error if exists
    if (errors.comments) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.comments;
        return newErrors;
      });
    }
  };

  const handleStrengthChange = (index: number, value: string) => {
    setFeedback(prev => {
      const strengths = [...(prev.strengths || [])];
      strengths[index] = value;
      return { ...prev, strengths };
    });
  };

  const addStrength = () => {
    setFeedback(prev => ({
      ...prev,
      strengths: [...(prev.strengths || []), '']
    }));
  };

  const removeStrength = (index: number) => {
    setFeedback(prev => {
      const strengths = [...(prev.strengths || [])];
      strengths.splice(index, 1);
      return { ...prev, strengths };
    });
  };

  const handleImprovementChange = (index: number, value: string) => {
    setFeedback(prev => {
      const improvements = [...(prev.improvements || [])];
      improvements[index] = value;
      return { ...prev, improvements };
    });
  };

  const addImprovement = () => {
    setFeedback(prev => ({
      ...prev,
      improvements: [...(prev.improvements || []), '']
    }));
  };

  const removeImprovement = (index: number) => {
    setFeedback(prev => {
      const improvements = [...(prev.improvements || [])];
      improvements.splice(index, 1);
      return { ...prev, improvements };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate standard scores
    if (!feedback.technical) {
      newErrors.technical = 'Technical score is required';
    }
    if (!feedback.completeness) {
      newErrors.completeness = 'Completeness score is required';
    }
    if (!feedback.communication) {
      newErrors.communication = 'Communication score is required';
    }
    
    // Validate rubric scores if present
    if (rubric) {
      rubric.components.forEach(component => {
        if (!feedback.scores?.[component.key]) {
          newErrors[`scores.${component.key}`] = `${component.name} score is required`;
        }
      });
    }
    
    // Validate comments
    if (!feedback.comments || feedback.comments.trim() === '') {
      newErrors.comments = 'Comments are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...feedback,
        status: 'submitted'
      });
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft({
        ...feedback,
        status: 'draft'
      });
    }
  };

  const renderScoreInput = (name: string, label: string, value: number, max: number = 10) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor={name}>
          {label}
        </label>
        <div className="flex items-center">
          <input
            type="range"
            id={name}
            name={name}
            min="0"
            max={max}
            value={value}
            onChange={(e) => handleScoreChange(name, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-2 w-8 text-center font-medium">{value}/{max}</span>
        </div>
        {errors[name] && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">Provide Feedback for Submission #{submissionId}</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Scores</h3>
        {renderScoreInput('technical', 'Technical Quality', feedback.technical || 0)}
        {renderScoreInput('completeness', 'Completeness', feedback.completeness || 0)}
        {renderScoreInput('communication', 'Communication', feedback.communication || 0)}
      </div>

      {rubric && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Rubric Components</h3>
          {rubric.components.map(component => (
            <div key={component.key} className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor={component.key}>
                {component.name}
                <span className="text-xs text-gray-500 ml-1">
                  (Weight: {component.weight})
                </span>
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id={component.key}
                  min="0"
                  max={component.maxScore}
                  value={feedback.scores?.[component.key] || 0}
                  onChange={(e) => handleRubricScoreChange(component.key, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-2 w-10 text-center font-medium">
                  {feedback.scores?.[component.key] || 0}/{component.maxScore}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{component.description}</p>
              {errors[`scores.${component.key}`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`scores.${component.key}`]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1" htmlFor="comments">
          Comments
        </label>
        <textarea
          id="comments"
          value={feedback.comments || ''}
          onChange={handleCommentsChange}
          rows={5}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          placeholder="Provide detailed feedback on the submission..."
        />
        {errors.comments && (
          <p className="mt-1 text-sm text-red-600">{errors.comments}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Strengths
        </label>
        {(feedback.strengths || []).map((strength, index) => (
          <div key={index} className="flex mb-2">
            <input
              type="text"
              value={strength}
              onChange={(e) => handleStrengthChange(index, e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="What did they do well?"
            />
            <button
              type="button"
              onClick={() => removeStrength(index)}
              className="ml-2 p-2 text-red-600"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStrength}
          className="mt-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm w-full"
        >
          + Add Strength
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Areas for Improvement
        </label>
        {(feedback.improvements || []).map((improvement, index) => (
          <div key={index} className="flex mb-2">
            <input
              type="text"
              value={improvement}
              onChange={(e) => handleImprovementChange(index, e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="What could they improve?"
            />
            <button
              type="button"
              onClick={() => removeImprovement(index)}
              className="ml-2 p-2 text-red-600"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addImprovement}
          className="mt-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm w-full"
        >
          + Add Area for Improvement
        </button>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            Cancel
          </button>
        )}
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
          >
            Save Draft
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
        >
          Submit Feedback
        </button>
      </div>
    </form>
  );
}
