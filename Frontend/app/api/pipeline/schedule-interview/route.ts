import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidate_id, candidate_name, date, time, notes } = body

    if (!candidate_id || !date) {
      return NextResponse.json({ error: 'candidate_id and date are required' }, { status: 400 })
    }

    // Forward to backend if available
    const backendUrl = process.env.BACKEND_URL
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/pipeline/schedule-interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (res.ok) {
          return NextResponse.json(await res.json())
        }
      } catch { /* fall through to mock response */ }
    }

    // Mock success response
    return NextResponse.json({
      id: `interview_${Date.now()}`,
      candidate_id,
      candidate_name,
      scheduled_date: date,
      scheduled_time: time || '10:00',
      notes: notes || '',
      status: 'scheduled',
      created_at: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 })
  }
}
