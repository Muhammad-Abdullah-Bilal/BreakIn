import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, content, tags } = body;
    const db = await getDatabase();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    updateData.updatedAt = new Date().toISOString();

    const result = await db.collection('posts').updateOne(
      { id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updatedPost = await db.collection('posts').findOne({ id: id });
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDatabase();

    const result = await db.collection('posts').deleteOne({ id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Also delete any comments associated with the post
    await db.collection('comments').deleteMany({ postId: id });

    return NextResponse.json({ message: 'Post and associated comments deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
