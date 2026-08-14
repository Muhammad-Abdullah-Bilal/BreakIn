import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Fast in-memory / non-blocking response
    return NextResponse.json({ success: true, recordedAt: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
