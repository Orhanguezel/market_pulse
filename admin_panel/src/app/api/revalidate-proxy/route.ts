import { NextRequest, NextResponse } from 'next/server';

const FRONTEND_INTERNAL_URL =
  process.env.PANEL_FRONTEND_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  'http://127.0.0.1:3095';
const REVALIDATE_SECRET =
  process.env.REVALIDATE_SECRET ||
  process.env.NEXT_PUBLIC_REVALIDATE_SECRET ||
  'dev-only-set-REVALIDATE_SECRET';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${FRONTEND_INTERNAL_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: REVALIDATE_SECRET, ...body }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'revalidation_proxy_failed' },
      { status: 502 },
    );
  }
}
