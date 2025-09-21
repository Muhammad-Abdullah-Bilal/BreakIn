// ===== FILE: app/api/developers/route.ts =====
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    console.log('🔍 Proxying developers request...')
    
    const response = await fetch(`${API_BASE_URL}/api/developers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }

    const developers = await response.json()
    
    console.log('✅ Successfully fetched developers from backend:', developers.length || 0)
    return NextResponse.json(developers)
  } catch (error) {
    console.error('❌ Failed to fetch developers:', error)
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Proxying developer creation request...')
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/developers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log('✅ Successfully created developer in backend')
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to create developer:', error)
    return NextResponse.json({ error: 'Failed to create developer' }, { status: 500 })
  }
}

