import { NextResponse } from 'next/server';

const CRAWLER_URL = process.env.CRAWLER_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const res = await fetch(`${CRAWLER_URL}/api/recording/status?sessionId=${sessionId}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Recording status proxy error:', error.message);
    return NextResponse.json(
      { error: 'Failed to connect to crawler backend' },
      { status: 502 }
    );
  }
}
