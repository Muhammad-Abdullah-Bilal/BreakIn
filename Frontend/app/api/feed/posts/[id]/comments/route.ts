import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDatabase();

    const comments = await db.collection('comments')
      .find({ postId: id })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ data: comments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ data: [], error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, author } = body;
    const db = await getDatabase();

    const newComment = {
      id: 'comment_' + Date.now(),
      postId: id,
      author: author || {
        id: 'u_current',
        username: 'john_mentor',
        displayName: 'John Evaluator',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      content: content || '',
      createdAt: new Date().toISOString()
    };

    await db.collection('comments').insertOne(newComment);

    // Increment repliesCount on the post document
    await db.collection('posts').updateOne(
      { id: id },
      { $inc: { repliesCount: 1 } }
    );

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
