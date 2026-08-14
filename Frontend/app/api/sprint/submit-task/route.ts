import { NextRequest, NextResponse } from 'next/server';
import { evaluateSubmittedCode } from '@/lib/codeEvaluator';
import { getDatabase } from '@/lib/mongodb';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solution, task, metrics, userId, sprintId, taskId } = body;

    // Run dynamic code evaluation
    const evaluation = evaluateSubmittedCode(solution || '', task || 'Sprint Task', metrics);

    // Dynamic database insertion for mentor review queue
    try {
      const db = await getDatabase();
      const submissionId = `sub_${Date.now()}`;
      
      const reviewItem = {
        submission_id: submissionId,
        sprint_id: sprintId || 'sprint-1',
        task_id: taskId || 'task-1',
        sprint_title: task || 'Sprint Simulation Task',
        anonymous_id: userId || 'dev_anonymous',
        submitted_at: new Date(),
        status: 'pending',
        priority: evaluation.score < 5.0 ? 'Urgent' : 'Standard',
        tests_passed: `${evaluation.checkpoints.filter(c => c.passed).length} / ${evaluation.checkpoints.length} Checkpoints`,
        ai_score: `${evaluation.score} / 10`,
        solution: solution || '',
        reviewer_id: 'mentor-1',
        created_at: new Date()
      };
      
      await db.collection('reviews').insertOne(reviewItem);
    } catch (dbErr) {
      console.warn('Could not write to MongoDB reviews collection directly:', dbErr);
    }

    // Forward to FastAPI Backend asynchronously if running
    try {
      await fetch(`${BACKEND_URL}/sprint/submit-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, evaluation }),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Task submitted and evaluated successfully',
      evaluation
    }, { status: 200 });
  } catch (error) {
    console.error('Error submitting task solution:', error);
    const fallbackEval = evaluateSubmittedCode('', 'Sprint Task');
    return NextResponse.json({
      success: true,
      message: 'Task evaluated with default profile',
      evaluation: fallbackEval
    }, { status: 200 });
  }
}
