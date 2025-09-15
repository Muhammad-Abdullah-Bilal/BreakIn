import { useState } from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { ReviewList } from '../components/ReviewList';
import { useFeedback } from '../hooks/useFeedback';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { Feedback } from '../types/feedback';
import { Review } from '../types/review';

interface ReviewPageProps {
  mentorId?: string;
}

export function ReviewPage({ mentorId }: ReviewPageProps) {
  const { reviews, loading: reviewsLoading, completeReview } = useReviewQueue({ mentorId });
  const { 
    activeRubric, 
    getFeedbackByReviewId, 
    createFeedback, 
    updateFeedback, 
    fetchRubric, 
    loading: feedbackLoading 
  } = useFeedback({ mentorId });
  
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string | null>(null);
  
  const loading = reviewsLoading || feedbackLoading;

  // Mock function to fetch submission content
  const fetchSubmissionContent = async (submissionId: string) => {
    // In a real app, this would be an API call
    // const response = await api.get(`/submissions/${submissionId}`);
    // setSubmissionContent(response.data.content);
    
    // Mock implementation with a delay
    await new Promise(resolve => setTimeout(resolve, 300));
    setSubmissionContent(
      `This is a mock submission content for submission ${submissionId}.
      
      # Project Title
      
      ## Description
      This project implements a feature that allows users to submit reviews for products.
      
      ## Implementation Details
      - Used React hooks for state management
      - Implemented form validation with error handling
      - Added responsive design for mobile devices
      
      ## Challenges Faced
      The main challenge was handling form validation and submission states.
      
      ## Code Snippets
      \`\`\`jsx
      function ReviewForm() {
        const [formData, setFormData] = useState({});
        
        const handleSubmit = (e) => {
          e.preventDefault();
          // Submit logic here
        };
        
        return (
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
          </form>
        );
      }
      \`\`\`
      `
    );
  };

  const handleSelectReview = async (review: Review) => {
    setSelectedReview(review);
    await fetchSubmissionContent(review.submissionId);
    if (!activeRubric) {
      await fetchRubric();
    }
  };

  const handleBackToList = () => {
    setSelectedReview(null);
    setSubmissionContent(null);
  };

  const handleSubmitFeedback = async (feedback: Partial<Feedback>) => {
    if (selectedReview) {
      const existingFeedback = getFeedbackByReviewId(selectedReview.id);
      
      if (existingFeedback) {
        await updateFeedback(existingFeedback.id, feedback);
      } else {
        await createFeedback({
          ...feedback,
          reviewId: selectedReview.id,
          mentorId,
          menteeId: 'unknown', // In real app, this would come from the submission
        });
      }
      
      await completeReview(selectedReview.id);
      handleBackToList();
    }
  };

  const handleSaveDraft = async (feedback: Partial<Feedback>) => {
    if (selectedReview) {
      const existingFeedback = getFeedbackByReviewId(selectedReview.id);
      
      if (existingFeedback) {
        await updateFeedback(existingFeedback.id, feedback);
      } else {
        await createFeedback({
          ...feedback,
          reviewId: selectedReview.id,
          mentorId,
          menteeId: 'unknown', // In real app, this would come from the submission
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {selectedReview ? (
        <div>
          <button 
            onClick={handleBackToList}
            className="flex items-center text-indigo-600 dark:text-indigo-400 mb-6"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-4 h-4 mr-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to review queue
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Submission Content</h2>
              {submissionContent ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow overflow-auto max-h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm">{submissionContent}</pre>
                </div>
              ) : (
                <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
              )}
            </div>
            
            <div>
              <FeedbackForm
                submissionId={selectedReview.submissionId}
                review={selectedReview}
                rubric={activeRubric}
                onSubmit={handleSubmitFeedback}
                onSaveDraft={handleSaveDraft}
                onCancel={handleBackToList}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-6">Review Queue</h1>
          <ReviewList 
            reviews={reviews} 
            onSelectReview={handleSelectReview} 
            loading={loading} 
          />
        </div>
      )}
    </div>
  );
}
