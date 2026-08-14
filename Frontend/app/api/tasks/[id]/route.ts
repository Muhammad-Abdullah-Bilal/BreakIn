import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'default-user';

    // Real task payload definition
    const taskData = {
      id: taskId,
      title: taskId === 't1' ? 'Implement Payment Processor API' : `Task ${taskId}`,
      description: 'Design and implement a robust REST API service for transaction processing with Stripe idempotency and automated error handling.',
      difficulty: 'Medium',
      estimatedTime: '45m',
      theme: 'FinTech Microservice',
      instructions: [
        'Initialize payment intent handling.',
        'Validate incoming webhook signatures.',
        'Implement error rollback and ledger recording.',
        'Add unit test coverage for invalid currencies.'
      ],
      starterCode: `// BreakIn Sprint Task: Implement Payment Processor
import { Request, Response } from 'express';

export async function processPayment(req: Request, res: Response) {
  const { amount, currency, recipientId } = req.body;
  
  // TODO: Implement payment validation and execution
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  return res.status(200).json({
    success: true,
    transactionId: 'txn_' + Date.now(),
    status: 'COMPLETED'
  });
}
`,
      hints: [
        'Remember to verify idempotency keys to prevent duplicate billing.',
        'Always sanitize numeric currencies before floating point math.'
      ]
    };

    return NextResponse.json(taskData, { status: 200 });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}
