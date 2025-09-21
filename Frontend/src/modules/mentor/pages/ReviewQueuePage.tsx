"use client";

// ReviewQueuePage: list of submissions awaiting review

import { ReviewCard } from "../components/ReviewCard";
import { useReviewQueue } from "../hooks/useReviewQueue";

// Mocked submissions for demo (reuse from MentorDashboard)
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

export default function ReviewQueuePage() {
  const { reviews } = useReviewQueue();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Review Queue</h1>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          submission={MOCK_SUBMISSIONS[review.submissionId]}
        />
      ))}
    </div>
  );
}
