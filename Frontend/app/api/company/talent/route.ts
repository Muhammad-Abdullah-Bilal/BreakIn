import { getDatabase } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get('skill')
    const query: any = {}

    if (skill) {
      query.skills = { $regex: new RegExp(skill, 'i') }
    }

    const developers = await db.collection('developers')
      .find(query)
      .sort({ reputation: -1 })
      .toArray()

    return NextResponse.json(developers)
  } catch (error) {
    console.error('Error fetching talent from MongoDB:', error)
    return NextResponse.json({ error: 'Failed to fetch talent' }, { status: 500 })
  }
}
