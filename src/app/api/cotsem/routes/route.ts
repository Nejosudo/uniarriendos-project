import { NextResponse } from 'next/server';
import data from '@/lib/cotsem/routes.json';
export async function GET() {
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } });
}
