import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getVapidKeys } from '@/lib/push';

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ publicKey: getVapidKeys().publicKey });
}
