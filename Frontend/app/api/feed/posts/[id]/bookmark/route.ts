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
      { $set: { isBookmarked: true } }
    );

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(id)) {
          await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            { $set: { isBookmarked: true } }
          );
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    return NextResponse.json({ error: 'Failed to bookmark post' }, { status: 500 });
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
      { $set: { isBookmarked: false } }
    );

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(id)) {
          await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            { $set: { isBookmarked: false } }
          );
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    return NextResponse.json({ error: 'Failed to unbookmark post' }, { status: 500 });
  }
}
