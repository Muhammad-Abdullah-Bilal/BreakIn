// app/api/logs/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_LOGS === 'true') {
      console.log('Client log received:', Array.isArray(body?.logs) ? body.logs.length : 1);
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
