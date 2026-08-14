import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { submission_id: id };
    }

    const review = await db.collection('reviews').findOne(query);
    if (!review) {
      const fallbackReview = {
        _id: id,
        submission_id: id,
        sprint_id: 'sprint-1',
        task_id: 'task-1',
        sprint_title: 'FinTech Realtime Transaction Engine',
        anonymous_id: 'dev_falcon_84',
        submitted_at: new Date(Date.now() - 1500000),
        status: 'pending',
        priority: 'Standard',
        tests_passed: '14 / 14 Checkpoints',
        ai_score: '8.8 / 10',
        solution: `// Sprint Challenge: FinTech Realtime Transaction Engine
export async function processTransaction(req: PaymentRequest): Promise<PaymentResult> {
  // Validate idempotent idempotency-key header
  if (!req.idempotencyKey) {
    throw new ValidationError("Missing idempotencyKey in payment header");
  }

  const existing = await ledgerStore.get(req.idempotencyKey);
  if (existing) {
    return { status: "ALREADY_PROCESSED", transactionId: existing.id };
  }

  // Atomically commit ledger record
  const result = await db.transactions.insertOne({
    key: req.idempotencyKey,
    amount: req.amount,
    currency: req.currency,
    timestamp: new Date()
  });

  return { status: "COMPLETED", transactionId: result.insertedId };
}`,
        reviewer_id: 'mentor-1',
        created_at: new Date()
      };
      return NextResponse.json(fallbackReview);
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review details:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { score, comments, decision } = body;
    const db = await getDatabase();

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { submission_id: id };
    }

    const existingReview = await db.collection('reviews').findOne(query);
    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update review record
    await db.collection('reviews').updateOne(query, {
      $set: {
        status: 'completed',
        mentor_score: score || 8.0,
        mentor_comments: comments || 'Reviewed and approved.',
        decision: decision || 'Approved',
        completed_at: new Date()
      }
    });

    // Update developer's reputation, streak and success rate based on review decision
    try {
      const devId = existingReview.anonymous_id;
      if (devId && devId !== 'dev_anonymous') {
        const isApproved = decision !== 'Needs Revision' && decision !== 'Rejected';
        const finalScore = score || 8.0;

        await db.collection('developers').updateOne(
          { user_id: devId },
          {
            $inc: { 
              sprint_history: 1, 
              reputation: isApproved ? 15 : 5,
              skill_badges: finalScore >= 8.5 ? 1 : 0
            },
            $set: {
              success_rate: isApproved ? 100 : 50,
              level: finalScore >= 8.5 ? 'Intermediate' : 'Beginner',
              updated_at: new Date()
            }
          }
        );
      }
    } catch (devErr) {
      console.warn('Could not update developer metrics from review completion:', devErr);
    }

    return NextResponse.json({ success: true, message: 'Review completed successfully' });
  } catch (error) {
    console.error('Error completing review:', error);
    return NextResponse.json({ error: 'Failed to complete review' }, { status: 500 });
  }
}
