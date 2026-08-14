import { getDatabase } from '@/lib/mongodb'
import { Sprint } from '@/lib/models/types'

export async function GET() {
  try {
    const db = await getDatabase()
    const sprints = await db.collection<Sprint>('sprints')
      .find({})
      .sort({ created_at: -1 })
      .toArray()
    
    return Response.json(sprints)
  } catch (error) {
    console.error('Error fetching available sprints from MongoDB:', error)
    return Response.json({ error: 'Failed to fetch available sprints' }, { status: 500 })
  }
}
