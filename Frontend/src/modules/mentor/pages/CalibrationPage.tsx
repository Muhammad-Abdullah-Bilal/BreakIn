'use client';

import React, { useState } from 'react';
import { CalibrationChart } from '../components/CalibrationChart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sliders, CheckSquare, Sparkles } from 'lucide-react';

export default function CalibrationPage() {
  const [strictness, setStrictness] = useState(3.5);
  
  const getStrictnessFeedback = (val: number) => {
    if (val < 2.5) {
      return {
        label: 'Highly Critical (Strict)',
        color: 'text-red-400 bg-red-950/40 border-red-800',
        advice: 'You evaluate code strictly. Ensure to provide clear constructive hints so candidates understand how to refactor their logic.'
      };
    }
    if (val > 4.2) {
      return {
        label: 'Extremely Lenient',
        color: 'text-amber-400 bg-amber-950/40 border-amber-800',
        advice: 'You award top scores easily. Ensure developers demonstrate proper boundary error catching before passing them.'
      };
    }
    return {
      label: 'Accurately Calibrated',
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800',
      advice: 'Your grading standards are aligned with global benchmarks. This ensures fair, consistent evaluation outcomes.'
    };
  };

  const currentFeedback = getStrictnessFeedback(strictness);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-800 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Mentor Rubric Calibration
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Compare your evaluation scoring distributions, calibrate grading tolerances, and align with global accreditation criteria.
          </p>
        </div>

        {/* Chart Card */}
        <CalibrationChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strictness Control */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <CardTitle className="text-base text-white">Interactive Tolerance Setting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag the calibration slider to simulate your evaluation style. Check how it aligns with peer metrics.
              </p>
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Critical Index</span>
                  <span className="text-white font-bold">{strictness.toFixed(1)} / 5.0</span>
                </div>
                <input 
                  type="range" 
                  min="1.0" 
                  max="5.0" 
                  step="0.1" 
                  value={strictness}
                  onChange={(e) => setStrictness(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${currentFeedback.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Calibration Result</span>
                  <Badge className="bg-slate-950/80 border-slate-800 text-[10px] uppercase font-mono px-2 py-0.5">
                    {currentFeedback.label}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed">{currentFeedback.advice}</p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Standards */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-base text-white">Audit Checklist Standards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Defensive Bounds Check', desc: 'Verify inputs (e.g. amount, query strings) are validated before logic execution.' },
                { title: 'Concurrent Race Protection', desc: 'Confirm state mutations (e.g., redis keys, database edits) use atomic queries.' },
                { title: 'Exception Enclosures', desc: 'Ensure gateway operations or external APIs are enclosed in try-catch/except blocks.' },
                { title: 'Modular Function Contracts', desc: 'Check that function signatures return matching dynamic schemas.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 font-bold font-mono">
                    ✓
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{item.title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Calibration Help */}
        <Card className="bg-slate-900/60 border border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-base text-white">AI Grading Alignment Tip</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              Mentors whose scores deviate by more than **1.5 points** from the team average undergo standard alignment calibration. Consistent, rubrics-based grading ensures BreakIn developers receive reliable, constructive career endorsements.
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Last updated: Calibration sync completed 10 minutes ago
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
