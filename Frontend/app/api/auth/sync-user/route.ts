// ===== FILE: app/api/auth/sync-user/route.ts =====
import { Developer } from '@/lib/models/types';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    const body = await request.json().catch(() => ({})) as { email?: string; pseudonym?: string; name?: string; avatar_url?: string }

    const identity = {
      email: body.email || '',
      pseudonym: body.pseudonym || `user_${Math.random().toString(36).slice(2, 8)}`,
      name: body.name || 'Developer'
    }

    // We used to key by Supabase user_id. Without it, key by pseudonym for now.
    const existingByPseudonym = await db.collection<Developer>('developers').findOne({ codename: { $regex: `^${identity.pseudonym}` } })
    if (existingByPseudonym) {
      return Response.json({ message: 'User already exists', developer: existingByPseudonym })
    }

    const newDeveloper: Omit<Developer, '_id'> = {
      user_id: identity.pseudonym, // temporary key
      codename: identity.pseudonym,
      email: identity.email,
      reputation: 0,
      skills: [],
      sprint_history: 0,
      success_rate: 0,
      growth_delta: '+0%',
      status: 'Available',
      mentor_endorsements: 0,
      team_rating: 0,
      avatar_url: body.avatar_url || '',
      total_earnings: '$0',
      skill_badges: 0,
      current_streak: 0,
      level: 'Beginner',
      created_at: new Date(),
      updated_at: new Date()
    }

    const result = await db.collection<Developer>('developers').insertOne(newDeveloper)

    // Seed some skill progress and activity
    const initialSkills = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'AWS']
    const skillProgressEntries = initialSkills.map(skill => ({
      user_id: newDeveloper.user_id!,
      skill,
      level: Math.floor(Math.random() * 30) + 10,
      badge: 'Beginner' as const,
      updated_at: new Date()
    }))
    await db.collection('skill_progress').insertMany(skillProgressEntries)

    await db.collection('activities').insertOne({
      user_id: newDeveloper.user_id!,
      type: 'skill_earned',
      title: 'Welcome to BreakIn Direct! Profile created successfully',
      time: new Date(),
      created_at: new Date()
    })

    return Response.json({
      message: 'User profile created successfully',
      developer: { ...newDeveloper, _id: result.insertedId }
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error syncing user:', error)
    return Response.json({ error: 'Failed to sync user profile' }, { status: 500 })
  }
}