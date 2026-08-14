// app/api/evaluate/code-snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { evaluateSubmittedCode } from '@/lib/codeEvaluator';

export async function POST(request: NextRequest) {
  try {
    const snapshot = await request.json();
    const { code, metrics, task } = snapshot;

    // Evaluate code snapshot
    const evaluation = evaluateSubmittedCode(code || '', task || 'Code Snapshot', metrics);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Evaluation failed' },
      { status: 500 }
    );
  }
}