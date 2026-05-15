import { NextResponse } from 'next/server';

function configuredIndexNowKey(): string {
  return String(
    process.env.INDEXNOW_KEY ||
    process.env.NEXT_PUBLIC_INDEXNOW_KEY ||
    '',
  ).trim();
}

export async function GET(request: Request) {
  const indexNowKey = new URL(request.url).pathname.replace(/^\//, '').replace(/\.txt$/, '');
  const key = configuredIndexNowKey();

  if (!key || indexNowKey !== key) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(key, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
