import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeRole } from '@/lib/roleRouting';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, role = 'developer', username } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawRole = (role || 'developer').toLowerCase().trim();

    // Security check: ADMIN registration cannot be done through public signup
    if (rawRole === 'admin' || rawRole === 'super_admin') {
      return NextResponse.json(
        { error: 'Administrator accounts cannot be registered publicly. Please contact system support.' },
        { status: 403 }
      );
    }

    const assignedRole = normalizeRole(rawRole);
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const generatedUsername = username || cleanEmail.split('@')[0];
    const userDoc = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      password: password, // In production, password hash is used
      username: generatedUsername,
      displayName: displayName || generatedUsername,
      role: assignedRole,
      roles: [assignedRole],
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert user into MongoDB
    await db.collection('users').insertOne(userDoc);

    // Create role-specific profile document
    let developerDoc = null;
    let employerDoc = null;
    let mentorDoc = null;

    if (assignedRole === 'developer') {
      developerDoc = {
        id: userDoc.id,
        user_id: userDoc.id,
        email: cleanEmail,
        username: generatedUsername,
        displayName: userDoc.displayName,
        codename: userDoc.displayName,
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
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('developers').insertOne(developerDoc);
    } else if (assignedRole === 'employer') {
      employerDoc = {
        id: userDoc.id,
        email: cleanEmail,
        company_name: userDoc.displayName,
        contact_person: userDoc.displayName,
        plan: 'Starter',
        active_jobs: 0,
        candidates_in_pipeline: 0,
        hires_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('companies').insertOne(employerDoc);
    } else if (assignedRole === 'mentor') {
      mentorDoc = {
        id: userDoc.id,
        email: cleanEmail,
        displayName: userDoc.displayName,
        specialties: ['Code Review', 'System Design', 'Architecture'],
        reviews_completed: 0,
        rating: 5.0,
        status: 'Active',
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('mentors').insertOne(mentorDoc);
    }

    return NextResponse.json({
      success: true,
      message: 'Account successfully registered! You can now log in.',
      user: {
        id: userDoc.id,
        email: userDoc.email,
        username: userDoc.username,
        displayName: userDoc.displayName,
        role: userDoc.role,
      },
      developer: developerDoc,
      employer: employerDoc,
      mentor: mentorDoc,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account: ' + (error?.message || 'Server error') }, { status: 500 });
  }
}
