import { getDatabase } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = await getDatabase()
    const reviews = await db.collection('reviews')
      .find({})
      .sort({ created_at: -1 })
      .toArray()

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews from MongoDB:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
