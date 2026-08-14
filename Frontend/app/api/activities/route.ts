import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    try {
      const db = await getDatabase();
      const activities = await db.collection('activities')
        .find({ 
          $or: [
            { user_id: userId },
            { userId: userId },
            { email: userId },
            { username: userId }
          ]
        })
        .sort({ created_at: -1, time: -1 })
        .limit(20)
        .toArray();

      return NextResponse.json(activities || [], { status: 200 });
    } catch {
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    
    const activity = {
      ...body,
      created_at: new Date(),
    };
    
    await db.collection('activities').insertOne(activity);
    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
