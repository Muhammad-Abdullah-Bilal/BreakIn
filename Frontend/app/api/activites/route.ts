// ===== FILE: app/api/activities/route.ts =====
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    console.log('🔍 Proxying activities request for user:', userId)
    
    // Build the backend URL with query parameters
    const backendUrl = new URL('/api/activities', API_BASE_URL)
    if (userId) {
      backendUrl.searchParams.set('user_id', userId)
    }
    
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }

    const activities = await response.json()
    
    console.log('✅ Successfully fetched activities from backend:', activities.length || 0)
    return NextResponse.json(activities)
  } catch (error) {
    console.error('❌ Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
    
    console.log('✅ Found activities:', activities.length)
    return Response.json(activities)
  } catch (error) {
    console.error('❌ Error fetching activities:', error)
    return Response.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = await getDatabase()
    
    const newActivity: Omit<Activity, '_id'> = {
      ...body,
      time: new Date(),
      created_at: new Date()
    }
    
    const result = await db.collection<Activity>('activities').insertOne(newActivity)
    
    return Response.json({ id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating activity:', error)
    return Response.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}

