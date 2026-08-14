import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    const result = await db.collection('posts').updateOne(
      { id: id },
      { 
        $inc: { likesCount: 1 },
        $set: { isLiked: true }
      }
    );

    if (result.matchedCount === 0) {
      // Fallback update if using ObjectId
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(id)) {
          await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            { 
              $inc: { likesCount: 1 },
              $set: { isLiked: true }
            }
          );
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    const result = await db.collection('posts').updateOne(
      { id: id },
      { 
        $inc: { likesCount: -1 },
        $set: { isLiked: false }
      }
    );

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(id)) {
          await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            { 
              $inc: { likesCount: -1 },
              $set: { isLiked: false }
            }
          );
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
