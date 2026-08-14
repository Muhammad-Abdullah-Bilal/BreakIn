import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    let posts: any = await db.collection('posts')
      .find({})
      .sort({ created_at: -1, createdAt: -1 })
      .toArray();

    // Seed initial posts if collection is completely empty
    if (!posts || posts.length === 0) {
      const seedPosts = [
        {
          id: 'post_1',
          author: {
            id: 'u1',
            username: 'alex_dev',
            displayName: 'Alex Rivers',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
            reputation: 1420
          },
          title: 'How I optimized WebSocket connections for real-time code evaluation',
          content: 'When evaluating sprints with live code updates, streaming AST diffs via WebSockets reduced our server roundtrip from 450ms to 42ms. Here are 3 key takeaways on state compression...',
          type: 'discussion',
          visibility: 'public',
          tags: ['WebSockets', 'Performance'],
          likesCount: 38,
          repliesCount: 12,
          viewsCount: 245,
          createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        },
        {
          id: 'post_2',
          author: {
            id: 'u2',
            username: 'schen',
            displayName: 'Sarah Chen',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
            reputation: 980
          },
          title: 'Architectural Discussion: Event-Driven Microservices in Distributed Sprints',
          content: 'Should we decouple the evaluation engine using RabbitMQ or Kafka for handling concurrent sprint submissions? We tested 10,000 requests/sec with both. Here is our benchmark report.',
          type: 'showcase',
          visibility: 'public',
          tags: ['Architecture', 'Microservices'],
          likesCount: 52,
          repliesCount: 19,
          viewsCount: 310,
          createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
        }
      ];
      await db.collection('posts').insertMany(seedPosts);
      posts = seedPosts;
    }

    return NextResponse.json({
      data: posts,
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: posts.length
      },
      hasNext: false
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json({ data: [], hasNext: false }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, tags, visibility, author } = body;
    const db = await getDatabase();

    const newPost = {
      id: 'post_' + Date.now(),
      author: author || {
        id: 'u_current',
        username: 'john_mentor',
        displayName: 'John Evaluator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        reputation: 150
      },
      title: title || 'Untitled Discussion',
      content: content || '',
      type: type || 'discussion',
      visibility: visibility || 'public',
      tags: tags || [],
      likesCount: 0,
      repliesCount: 0,
      viewsCount: 1,
      createdAt: new Date().toISOString()
    };

    await db.collection('posts').insertOne(newPost);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
