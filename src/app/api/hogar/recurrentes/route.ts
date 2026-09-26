import { NextRequest, NextResponse } from 'next/server';
import { requireEditor, requireSession } from '@/lib/auth';
import { getHogarRecurrentes, createHogarRecurrente } from '@/lib/db';
import { parseRecurrenteBody } from '@/lib/recurrentes';

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(getHogarRecurrentes());
}

export async function POST(request: NextRequest) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const data = parseRecurrenteBody(await request.json());
  if (!data) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  createHogarRecurrente(data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
