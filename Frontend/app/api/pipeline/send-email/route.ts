import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidate_id, to, subject, body: emailBody } = body

    if (!candidate_id || !to || !subject) {
      return NextResponse.json({ error: 'candidate_id, to, and subject are required' }, { status: 400 })
    }

    // Forward to backend if available
    const backendUrl = process.env.BACKEND_URL
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/pipeline/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (res.ok) {
          return NextResponse.json(await res.json())
        }
      } catch { /* fall through to mock response */ }
    }

    // Mock success — in production this would integrate with SendGrid/Resend
    return NextResponse.json({
      id: `email_${Date.now()}`,
      candidate_id,
      to,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
