import { NextRequest, NextResponse } from 'next/server';
import { POST as handlePostGenerate } from '../route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handlePostGenerate(req);
}
