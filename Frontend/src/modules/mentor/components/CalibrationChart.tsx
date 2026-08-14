'use client';

import React from 'react';

interface CalibrationData {
  category: string;
  yourScore: number;
  averageScore: number;
}

interface CalibrationChartProps {
  data?: CalibrationData[];
}

export function CalibrationChart({ data }: CalibrationChartProps) {
  const chartData = data || [
    { category: 'Technical Rigor', yourScore: 8.4, averageScore: 8.1 },
    { category: 'Code Architecture', yourScore: 7.9, averageScore: 8.2 },
    { category: 'Efficiency & Complexity', yourScore: 8.8, averageScore: 7.6 },
    { category: 'Feedback Richness', yourScore: 9.2, averageScore: 8.5 }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Grading Consistency Index</h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-slate-300">Your Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-700 rounded-full" />
              <span className="text-slate-300">Global Mentor Average</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {chartData.map((item, idx) => {
            const maxVal = 10;
            const yourWidth = `${(item.yourScore / maxVal) * 100}%`;
            const avgWidth = `${(item.averageScore / maxVal) * 100}%`;
            const deviation = (item.yourScore - item.averageScore).toFixed(1);
            const isPositive = parseFloat(deviation) >= 0;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{item.category}</span>
                  <span className={`font-mono font-semibold ${isPositive ? 'text-indigo-400' : 'text-emerald-400'}`}>
                    {item.yourScore} vs {item.averageScore} ({isPositive ? `+${deviation}` : deviation})
                  </span>
                </div>

                <div className="space-y-1.5 relative pt-1">
                  {/* Your score bar */}
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: yourWidth }}
                    />
                  </div>
                  
                  {/* Global average bar */}
                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-700 rounded-full transition-all duration-500"
                      style={{ width: avgWidth }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
