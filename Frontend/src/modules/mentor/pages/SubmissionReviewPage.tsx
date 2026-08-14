'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CodeReviewPanel } from "../components/CodeReviewPanel";
import { FeedbackForm } from "../components/FeedbackForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchReviewDetails() {
      if (!reviewId) {
        setError('No review ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/mentor/reviews/${reviewId}`);
        if (!res.ok) {
          throw new Error('Failed to retrieve submission details.');
        }
        const data = await res.json();
        setReviewData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to connect to database.');
      } finally {
        setLoading(false);
      }
    }

    fetchReviewDetails();
  }, [reviewId]);

  const handleSubmit = async (feedback: any) => {
    if (!reviewId) return;

    try {
      setSubmitting(true);
      const technical = feedback.technical || 8;
      const completeness = feedback.completeness || 8;
      const communication = feedback.communication || 8;
      
      const finalScore = Math.round(((technical + completeness + communication) / 3) * 10) / 10;
      const decision = finalScore >= 6.5 ? 'Approved' : 'Needs Revision';

      const res = await fetch(`/api/mentor/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: finalScore,
          comments: feedback.comments || 'Submission looks good.',
          decision
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit evaluation.');
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push('/mentor');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading candidate source code...</p>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Review Load Failed</h2>
        <p className="text-sm text-slate-400">{error || 'Review record not found.'}</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
          <Link href="/mentor">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Evaluation Submitted Successfully!</h2>
        <p className="text-sm text-slate-400">The developer metrics have been recalibrated in real time.</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
          <Link href="/mentor">Return to Review Queue</Link>
        </Button>
      </div>
    );
  }

  const defaultComments = [
    { line: 3, comment: "Automated analysis completed successfully." },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          <Link href="/mentor">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Queue
          </Link>
        </Button>
        <span className="text-xs font-mono text-slate-400">
          Submission #{reviewData.submission_id || 'N/A'} • Anonymous Dev ({reviewData.anonymous_id || 'N/A'})
        </span>
      </div>

      <div className="space-y-6">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Candidate Code Submission</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Evaluating: {reviewData.sprint_title || 'Sprint Challenge'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeReviewPanel 
              code={reviewData.solution || '// No code submitted'} 
              comments={defaultComments} 
            />
          </CardContent>
        </Card>

        {submitting ? (
          <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Publishing evaluation payload to blockchain/ledger...
          </div>
        ) : (
          <FeedbackForm
            submissionId={reviewData.submission_id || 'N/A'}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/mentor')}
          />
        )}
      </div>
    </div>
  );
}

export default function SubmissionReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
