"use client";

import { useReviewQueue } from "../hooks/useReviewQueue";
import { ReviewCard } from "../components/ReviewCard";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReviewQueuePage() {
  const router = useRouter();
  const { reviews, loading, fetchReviews } = useReviewQueue();

  const handleSelectReview = (review: any) => {
    router.push(`/mentor/review?id=${review.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Fetching live review assignments...</p>
      </div>
    );
  }

  const pendingReviews = reviews.filter(r => r.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Review Queue</h1>
        <span className="text-xs text-slate-400 font-mono">
          {pendingReviews.length} Submissions Awaiting Feedback
        </span>
      </div>

      {pendingReviews.length > 0 ? (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onSelect={handleSelectReview}
              submission={{
                sprintTitle: review.sprintTitle || 'Sprint Simulation Task',
                anonymousId: review.anonymousId || 'dev_anonymous',
                createdAt: review.createdAt
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="All Caught Up!"
          description="There are currently no developer submissions waiting for mentor review."
          actionLabel="Refresh Queue"
          onAction={fetchReviews}
          badge="Queue Clear"
        />
      )}
    </div>
  );
}
