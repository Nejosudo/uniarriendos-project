import { NextRequest, NextResponse } from 'next/server';
import { searchSemantic } from '@/lib/search/semantic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const result: any = await searchSemantic(q, ip);
  if (result.error) return NextResponse.json(result, { status: result.fallback ? 500 : 400 });
  return NextResponse.json(result);
}
