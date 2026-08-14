import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDatabase();

    // Look up user in MongoDB Atlas
    const user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

    // Verify password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    // Fetch or create matching developer profile
    let developer: any = await db.collection('developers').findOne({ email: cleanEmail });
    if (!developer) {
      const newDev = {
        id: user.id || `dev_${Date.now()}`,
        user_id: user.id || `dev_${Date.now()}`,
        email: cleanEmail,
        codename: user.displayName || user.username || 'Developer',
        displayName: user.displayName || user.username || 'Developer',
        username: user.username,
        level: 'Beginner',
        status: 'Available',
        reputation: 0,
        sprint_history: 0,
        success_rate: 0,
        total_earnings: '$0',
        skill_badges: 0,
        mentor_endorsements: 0,
        current_streak: 0,
        team_rating: 0,
        skills: ['JavaScript', 'TypeScript', 'React'],
      };
      await db.collection('developers').insertOne(newDev);
      developer = newDev;
    }

    const token = `jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const userRole = (user.role || (user.roles && user.roles[0]) || 'developer').toLowerCase();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id || user._id?.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username,
        role: userRole,
      },
      developer,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed: ' + (error?.message || 'Server error') }, { status: 500 });
  }
}
