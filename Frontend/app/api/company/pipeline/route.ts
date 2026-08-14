import { getDatabase } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = await getDatabase()
    const pipeline = await db.collection('pipeline')
      .find({})
      .toArray()

    return NextResponse.json(pipeline)
  } catch (error) {
    console.error('Error fetching pipeline from MongoDB:', error)
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const newCandidate = {
      ...body,
      id: body.id || 'candidate_' + Date.now(),
      current_stage: body.current_stage || 'sourced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await db.collection('pipeline').insertOne(newCandidate)
    return NextResponse.json(newCandidate, { status: 201 })
  } catch (error) {
    console.error('Error adding to pipeline:', error)
    return NextResponse.json({ error: 'Failed to add candidate to pipeline' }, { status: 500 })
  }
}
