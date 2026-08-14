'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CommentItem {
  line: number;
  comment: string;
}

interface CodeReviewPanelProps {
  code: string;
  comments?: CommentItem[];
}

export function CodeReviewPanel({ code, comments = [] }: CodeReviewPanelProps) {
  const codeLines = (code || '').split('\n');
  const commentMap = new Map<number, string>();
  comments.forEach(c => commentMap.set(c.line, c.comment));

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 font-mono text-xs">
      {/* File Header Tab */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-slate-400 font-mono text-[11px]">index.ts</span>
        <Badge className="bg-slate-800 border-slate-700 text-slate-300 text-[10px]">TypeScript</Badge>
      </div>

      {/* Code Container */}
      <div className="overflow-x-auto max-h-[450px] overflow-y-auto divide-y divide-slate-900">
        {codeLines.map((lineContent, idx) => {
          const lineNumber = idx + 1;
          const hasComment = commentMap.has(lineNumber);
          const inlineComment = commentMap.get(lineNumber);

          return (
            <div key={idx} className="group hover:bg-slate-900/40 transition-colors">
              <div className="flex items-start">
                {/* Line number gutter */}
                <div className="w-10 select-none text-right pr-3 text-slate-600 border-r border-slate-900 py-1 font-mono bg-slate-950 text-[10px]">
                  {lineNumber}
                </div>
                {/* Code line content */}
                <pre className="flex-1 pl-4 py-1 text-slate-300 overflow-x-auto whitespace-pre font-mono text-left">
                  {lineContent || ' '}
                </pre>
              </div>

              {/* Inline comments if any */}
              {hasComment && (
                <div className="pl-14 pr-4 py-2 bg-indigo-950/20 border-l-2 border-indigo-500 my-1 text-indigo-200">
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">💬 Mentor Tip:</span>
                    <p className="italic text-[11px] font-sans">{inlineComment}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
