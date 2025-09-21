// ReviewCard: preview of a submission needing review
import { Review } from '../types/review';

interface ReviewCardProps {
  review: Review;
  onSelect: (review: Review) => void;
  submission?: {
    sprintTitle: string;
    anonymousId: string;
    createdAt: string;
  };
}

export function ReviewCard({ review, onSelect, submission }: ReviewCardProps) {
  // Safety check for undefined review
  if (!review) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl shadow mb-4">
        <p className="text-gray-500">Review data not available</p>
      </div>
    );
  }
  
  const formattedDate = new Date(review.createdAt).toLocaleString();
  
  return (
    <div 
      className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition mb-4 cursor-pointer"
      onClick={() => onSelect && onSelect(review)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold">
          {submission?.sprintTitle || `Submission #${review.submissionId.substring(0, 8)}`}
        </h3>
        <span 
          className={`px-2 py-1 text-xs rounded-full ${
            review.status === 'pending' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          }`}
        >
          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        By: {submission?.anonymousId || review.reviewer}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Submitted: {new Date(submission?.createdAt || review.createdAt).toLocaleDateString()}
      </p>
      <button 
        className="mt-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(review);
        }}
      >
        Review
      </button>
    </div>
  );
}
