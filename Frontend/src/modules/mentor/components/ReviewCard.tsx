import { Review } from '../types/review';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

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
  if (!review) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
        Review data not available
      </div>
    );
  }

  const isPending = review.status === 'pending';

  return (
    <Card 
      onClick={() => onSelect && onSelect(review)}
      className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group"
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                {submission?.sprintTitle || 'Sprint Simulation Challenge'}
              </CardTitle>
              <Badge className={review.priority === 'Urgent' ? 'bg-red-950 border-red-800 text-red-300 text-[10px]' : 'bg-blue-950 border-blue-800 text-blue-300 text-[10px]'}>
                {review.priority || 'Standard'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Anonymous Developer: <span className="font-mono text-slate-200">{submission?.anonymousId || 'dev_anon'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <p className="text-emerald-400 font-mono font-semibold">{review.testsPassed || 'All Checks passed'}</p>
              <p className="text-slate-500 text-[11px]">AI Score: {review.aiScore || '8.5 / 10'}</p>
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(review);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1"
            >
              Start Review
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
