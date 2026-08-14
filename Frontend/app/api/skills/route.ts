// ===== FILE: app/api/skills/route.ts =====
import { getDatabase } from '@/lib/mongodb'
import { SkillProgress } from '@/lib/models/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return Response.json([], { status: 200 })
    }
    
    let skills: SkillProgress[] = []
    try {
      const db = await getDatabase()
      skills = await db.collection<SkillProgress>('skill_progress')
        .find({ 
          $or: [
            { user_id: userId },
            { userId: userId },
            { email: userId },
            { username: userId }
          ]
        })
        .sort({ updated_at: -1 })
        .toArray()
    } catch (dbErr) {
      console.warn('Database query fallback for skills:', dbErr)
    }
    
    return Response.json(skills || [])
  } catch (error) {
    console.error('❌ Error fetching skills:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = await getDatabase()
    
    const newSkill: Omit<SkillProgress, '_id'> = {
      ...body,
      updated_at: new Date()
    }
    
    const result = await db.collection<SkillProgress>('skill_progress').insertOne(newSkill)
    
    return Response.json({ id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating skill:', error)
    return Response.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}
