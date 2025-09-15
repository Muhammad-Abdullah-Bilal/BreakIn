'use client';

import React from 'react';
import { formatDate } from '../../core/utils/formatDate';
import { Feedback, FeedbackType } from '../types/feedback';
import { FeedbackRatingStars } from './FeedbackRatingStars';

type FeedbackCardProps = {
  feedback: Feedback;
  showDetails?: boolean;
  className?: string;
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
  feedback,
  showDetails = false,
  className = ''
}) => {
  const getFeedbackTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.CODE_REVIEW:
        return 'Code Review';
      case FeedbackType.SPRINT_REVIEW:
        return 'Sprint Review';
      case FeedbackType.MENTOR_FEEDBACK:
        return 'Mentor Feedback';
      case FeedbackType.PEER_FEEDBACK:
        return 'Peer Feedback';
      case FeedbackType.COMPANY_FEEDBACK:
        return 'Company Feedback';
      default:
        return 'Feedback';
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.CODE_REVIEW:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        );
      case FeedbackType.SPRINT_REVIEW:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        );
      case FeedbackType.MENTOR_FEEDBACK:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        );
      case FeedbackType.PEER_FEEDBACK:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        );
      case FeedbackType.COMPANY_FEEDBACK:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="mr-2 text-primary">
              {getFeedbackTypeIcon(feedback.type)}
            </div>
            <h3 className="font-medium">
              {getFeedbackTypeLabel(feedback.type)}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(feedback.createdAt, 'date')}
          </span>
        </div>
        
        {feedback.rating && (
          <div className="mb-4">
            <FeedbackRatingStars rating={feedback.rating} readOnly size="sm" />
          </div>
        )}
        
        <p className="text-sm mb-4">
          {feedback.content}
        </p>
        
        {feedback.categories && feedback.categories.length > 0 && showDetails && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium mb-2">Category Ratings</h4>
            {feedback.categories.map((category, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{category.name}</span>
                <FeedbackRatingStars rating={category.rating} readOnly size="sm" />
              </div>
            ))}
          </div>
        )}
        
        {/* Render specific feedback type details */}
        {showDetails && feedback.type === FeedbackType.CODE_REVIEW && 'codeQualityRating' in feedback && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Code Quality</span>
              <FeedbackRatingStars 
                rating={(feedback as any).codeQualityRating} 
                readOnly 
                size="sm" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Clean Code</span>
              <FeedbackRatingStars 
                rating={(feedback as any).cleanCodeRating} 
                readOnly 
                size="sm" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Best Practices</span>
              <FeedbackRatingStars 
                rating={(feedback as any).bestPracticesRating} 
                readOnly 
                size="sm" 
              />
            </div>
            
            {(feedback as any).suggestionPoints?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {(feedback as any).suggestionPoints.map((point: string, index: number) => (
                    <li key={index} className="text-sm">{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Show avatar and name of feedback provider */}
      <div className="px-5 py-3 border-t border-border flex items-center">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mr-3">
          {feedback.isAnonymous ? 'A' : 'JD'}
        </div>
        <span className="text-sm font-medium">
          {feedback.isAnonymous ? 'Anonymous' : 'John Doe'}
        </span>
      </div>
    </div>
  );
};
