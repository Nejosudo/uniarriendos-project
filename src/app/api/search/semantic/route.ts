import { NextRequest, NextResponse } from 'next/server';
import { searchSemantic } from '@/lib/search/semantic';
import { getClientIp } from '@/lib/rateLimit';

type SemanticResponse = { error?: string; fallback?: boolean; [key: string]: unknown };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const ip = getClientIp(req.headers);
  const result = (await searchSemantic(q, ip)) as SemanticResponse;
  if (result.error) return NextResponse.json(result, { status: result.fallback ? 500 : 400 });
  return NextResponse.json(result);
}
