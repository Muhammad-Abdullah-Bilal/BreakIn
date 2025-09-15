import { useState } from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { MenteeDetails } from '../components/MenteeDetails';
import { MenteeList } from '../components/MenteeList';
import { useFeedback } from '../hooks/useFeedback';
import { useMentees } from '../hooks/useMentees';
import { Mentee, MenteeSubmission } from '../types/mentee';

interface MenteesPageProps {
  mentorId?: string;
}

export function MenteesPage({ mentorId }: MenteesPageProps) {
  const { 
    mentees, 
    loading: menteesLoading, 
    getMenteeById, 
    getMenteeSubmissions, 
    reviewSubmission 
  } = useMentees({ mentorId });
  
  const { 
    activeRubric, 
    createFeedback, 
    loading: feedbackLoading 
  } = useFeedback({ mentorId });

  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [menteeSubmissions, setMenteeSubmissions] = useState<MenteeSubmission[]>([]);
  const [submissionToReview, setSubmissionToReview] = useState<MenteeSubmission | null>(null);
  
  const loading = menteesLoading || feedbackLoading;

  const handleSelectMentee = async (mentee: Mentee) => {
    setSelectedMentee(mentee);
    const submissions = await getMenteeSubmissions(mentee.id);
    setMenteeSubmissions(submissions);
  };

  const handleBackToMentees = () => {
    setSelectedMentee(null);
    setMenteeSubmissions([]);
  };

  const handleReviewSubmission = (submission: MenteeSubmission) => {
    setSubmissionToReview(submission);
  };

  const handleBackToSubmissions = () => {
    setSubmissionToReview(null);
  };

  const handleSubmitFeedback = async (feedback: any) => {
    if (!submissionToReview) return;
    
    // Calculate an overall score from the technical, completeness, communication scores
    const overallScore = Math.round(
      (feedback.technical + feedback.completeness + feedback.communication) / 3
    );
    
    // Determine status based on score threshold
    const status = overallScore >= 7 ? 'approved' : 'rejected';
    
    try {
      await reviewSubmission(
        submissionToReview.id,
        feedback.comments,
        overallScore,
        status
      );
      
      // Also create a feedback entry
      await createFeedback({
        ...feedback,
        menteeId: submissionToReview.menteeId,
      });
      
      // Refresh submissions
      if (selectedMentee) {
        const updatedSubmissions = await getMenteeSubmissions(selectedMentee.id);
        setMenteeSubmissions(updatedSubmissions);
      }
      
      setSubmissionToReview(null);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {submissionToReview ? (
        <div>
          <button 
            onClick={handleBackToSubmissions}
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
            Back to submissions
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Submission Content</h2>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow overflow-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap text-sm">{submissionToReview.content}</pre>
              </div>
            </div>
            
            <div>
              <FeedbackForm
                submissionId={submissionToReview.id}
                rubric={activeRubric}
                onSubmit={handleSubmitFeedback}
                onCancel={handleBackToSubmissions}
              />
            </div>
          </div>
        </div>
      ) : selectedMentee ? (
        <MenteeDetails
          mentee={selectedMentee}
          submissions={menteeSubmissions}
          onBack={handleBackToMentees}
          onReviewSubmission={handleReviewSubmission}
          loading={loading}
        />
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-6">Your Mentees</h1>
          <MenteeList 
            mentees={mentees} 
            onSelectMentee={handleSelectMentee} 
            loading={loading} 
          />
        </div>
      )}
    </div>
  );
}
