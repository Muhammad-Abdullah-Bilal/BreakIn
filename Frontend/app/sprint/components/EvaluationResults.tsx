'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Sparkles, Check, X, ShieldAlert, Code2 } from 'lucide-react';
import { CheckpointResult } from '@/lib/codeEvaluator';

interface EvaluationMetric {
  codeQuality: number;
  efficiency: number;
  problemSolving: number;
  creativity: number;
  functionalityScore?: number;
  correctnessScore?: number;
}

interface Evaluation {
  score: number;
  feedback: string;
  metrics: EvaluationMetric;
  suggestions: string[];
  checkpoints?: CheckpointResult[];
}

interface EvaluationResultsProps {
  evaluation: {
    totalSnapshots: number;
    averageScore: number;
    status?: 'PASSED' | 'FAILED' | 'NEEDS_REVISION';
    taskTitle?: string;
    lastEvaluation: Evaluation | null;
    timeline?: Array<{ time: string; score: number }>;
  };
  submittedCode?: string;
}

// Helper function to format metric names
const formatMetricName = (key: string): string => {
  const names: Record<string, string> = {
    codeQuality: "Code Quality",
    efficiency: "Efficiency",
    problemSolving: "Problem Solving",
    creativity: "Creativity",
    functionalityScore: "Functionality",
    correctnessScore: "Correctness"
  };
  return names[key] || key.replace(/([A-Z])/g, ' $1');
};

export function EvaluationResults({ evaluation, submittedCode }: EvaluationResultsProps) {
  if (!evaluation.lastEvaluation) {
    return (
      <div className="text-center p-8 text-slate-400">
        No evaluation data available.
      </div>
    );
  }

  const score = evaluation.lastEvaluation.score;
  const isPassing = score >= 6.5;
  const isFailing = score < 4.5;

  const scoreColor = isPassing ? 'text-emerald-400' : isFailing ? 'text-red-400' : 'text-amber-400';
  const badgeBg = isPassing ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : isFailing ? 'bg-red-950/80 border-red-800 text-red-300' : 'bg-amber-950/80 border-amber-800 text-amber-300';
  const badgeText = isPassing ? 'Verified Pass' : isFailing ? 'Evaluation Failed (Contract Unmet)' : 'Needs Revision';
  const checkpoints = evaluation.lastEvaluation.checkpoints || [];

  return (
    <div className="space-y-6">
      {/* Top Status & Metrics Grid */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2.5">
          {isPassing ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isFailing ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-white">Functional Evaluation Outcome</h3>
            <p className="text-xs text-slate-400">Scored strictly on task contract fulfillment, logic correctness, and parameter validation</p>
          </div>
        </div>
        <Badge className={badgeBg}>
          {badgeText}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className={`text-2xl font-bold font-mono ${scoreColor}`}>
            {score.toFixed(1)}/10
          </div>
          <div className="text-xs text-slate-400 mt-1">Final Task Score</div>
        </div>
        
        <div className="text-center p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {checkpoints.filter(c => c.passed).length}/{checkpoints.length || 4}
          </div>
          <div className="text-xs text-slate-400 mt-1">Test Checkpoints Passed</div>
        </div>
        
        <div className="text-center p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className={`text-2xl font-bold font-mono ${scoreColor}`}>
            {evaluation.lastEvaluation.metrics.codeQuality.toFixed(1)}/10
          </div>
          <div className="text-xs text-slate-400 mt-1">Code Quality Score</div>
        </div>
      </div>

      {/* Functional Test Checkpoints Breakdown */}
      {checkpoints.length > 0 && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-sm text-slate-200">Task Functional Contract Verification</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {checkpoints.filter(c => c.passed).length} of {checkpoints.length} Requirements Met
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {checkpoints.map((cp, idx) => (
              <div 
                key={idx} 
                className={`flex items-start justify-between p-3 rounded-lg border text-xs ${
                  cp.passed 
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
                    : 'bg-red-950/20 border-red-900/40 text-red-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-0.5 rounded-full ${cp.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cp.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">{cp.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cp.explanation}</p>
                  </div>
                </div>
                <Badge className={cp.passed ? 'bg-emerald-950 border-emerald-800 text-emerald-300 text-[10px]' : 'bg-red-950 border-red-800 text-red-300 text-[10px]'}>
                  {cp.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Rubric Feedback */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-sm text-slate-200">Automated Rubric Evaluation</h4>
        </div>
        
        <p className={`text-sm leading-relaxed p-3.5 rounded-lg border ${
          isFailing 
            ? 'bg-red-950/20 border-red-900/40 text-red-200' 
            : isPassing 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          {evaluation.lastEvaluation.feedback}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {(Object.entries(evaluation.lastEvaluation.metrics) as [keyof EvaluationMetric, number][]).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="text-base font-bold font-mono text-slate-200">
                {typeof value === 'number' ? value.toFixed(1) : value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {formatMetricName(key)}
              </div>
            </div>
          ))}
        </div>

        {evaluation.lastEvaluation.suggestions.length > 0 && (
          <div className="pt-2">
            <h5 className="font-semibold text-xs text-slate-300 mb-2">Required Improvements & Suggestions:</h5>
            <ul className="text-xs space-y-1.5">
              {evaluation.lastEvaluation.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {submittedCode && (
          <div className="pt-2">
            <h5 className="font-semibold text-xs text-slate-400 mb-1.5">Evaluated Code Snippet:</h5>
            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-36">
              {submittedCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}