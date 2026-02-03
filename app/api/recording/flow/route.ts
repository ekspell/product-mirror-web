import { NextResponse } from 'next/server';

const CRAWLER_URL = process.env.CRAWLER_URL || 'http://localhost:3001';

// Start a flow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const endpoint = action === 'end'
      ? `${CRAWLER_URL}/api/recording/flow/end`
      : `${CRAWLER_URL}/api/recording/flow/start`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Recording flow proxy error:', error.message);
    return NextResponse.json(
      { error: 'Failed to connect to crawler backend' },
      { status: 502 }
    );
  }
}
