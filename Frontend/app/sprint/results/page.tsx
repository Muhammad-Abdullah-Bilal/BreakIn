"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EvaluationResults } from '../components/EvaluationResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { evaluateSubmittedCode, EvaluationResult } from '@/lib/codeEvaluator';
import { ArrowLeft, RotateCcw, LayoutDashboard, ExternalLink } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprintId') || '';
  const taskId = searchParams.get('taskId') || '';

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEval = sessionStorage.getItem('latest_sprint_evaluation');
      const storedCode = sessionStorage.getItem('latest_sprint_code');

      if (storedCode) {
        setSubmittedCode(storedCode);
      }

      if (storedEval) {
        const parsed = JSON.parse(storedEval);
        setEvaluation(parsed);
      } else if (storedCode) {
        const evaluated = evaluateSubmittedCode(storedCode, 'Payment Integration Sprint');
        setEvaluation(evaluated);
      } else {
        // Default evaluation if accessed directly without submission
        const defaultEval = evaluateSubmittedCode('', 'Sprint Challenge');
        setEvaluation(defaultEval);
      }
    } catch (err) {
      console.error('Error loading sprint evaluation:', err);
      const fallback = evaluateSubmittedCode('', 'Sprint Challenge');
      setEvaluation(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Analyzing code structure & rubrics...</p>
        </div>
      </div>
    );
  }

  const evaluationData = {
    totalSnapshots: evaluation.totalSnapshots || 1,
    averageScore: evaluation.averageScore || evaluation.score,
    status: evaluation.status,
    taskTitle: evaluation.taskTitle,
    lastEvaluation: {
      score: evaluation.score,
      feedback: evaluation.feedback,
      metrics: {
        codeQuality: evaluation.codeQuality,
        efficiency: evaluation.efficiency,
        problemSolving: evaluation.problemSolving,
        creativity: evaluation.creativity,
        functionalityScore: evaluation.functionalityScore,
        correctnessScore: evaluation.correctnessScore
      },
      suggestions: evaluation.suggestions || [],
      checkpoints: evaluation.checkpoints || []
    },
    timeline: evaluation.timeline || []
  };

  const isFailing = evaluation.score < 5.0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1 pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Sprint Results</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time automated code evaluation, rubric grading, and mentor feedback
          </p>
        </div>

        {/* Evaluation Results Component */}
        <EvaluationResults 
          evaluation={evaluationData} 
          submittedCode={submittedCode} 
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
          <Button
            onClick={() => router.push(`/sprint/sprinting?sprintId=${sprintId}&taskId=${taskId}`)}
            variant="outline"
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm gap-1.5"
          >
            {isFailing ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Refactor in Workspace
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Workspace
              </>
            )}
          </Button>

          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-600/20 gap-1.5"
          >
            <Link href="/developer-dashboard">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}