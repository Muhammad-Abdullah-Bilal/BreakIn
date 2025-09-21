"use client";

// MentorDashboard: overview page

import { ReviewCard } from "../components/ReviewCard";
import { useReviewQueue } from "../hooks/useReviewQueue";

// Mocked submissions for demo
const MOCK_SUBMISSIONS = {
  s1: {
    sprintTitle: "Frontend Challenge",
    anonymousId: "dev123",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  s2: {
    sprintTitle: "API Integration",
    anonymousId: "dev456",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
};

export default function MentorDashboard() {
  const { reviews, loading, error } = useReviewQueue();
  
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Pending Reviews</h1>
        <p>Loading reviews...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Pending Reviews</h1>
        <p className="text-red-600">Error loading reviews: {error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Reviews</h1>
      {reviews && reviews.length > 0 ? (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onSelect={(selectedReview) => console.log('Selected review:', selectedReview)}
            submission={MOCK_SUBMISSIONS[review.submissionId]}
          />
        ))
      ) : (
        <p className="text-gray-500">No pending reviews found.</p>
      )}
    </div>
  );
}
