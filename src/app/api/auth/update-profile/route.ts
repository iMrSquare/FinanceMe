import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getUserById, updateUserProfile, toSessionUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { nombre } = await request.json();
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  updateUserProfile(session.id, nombre.trim());

  const user = getUserById(session.id);
  if (user) {
    await setSessionCookie(toSessionUser(user));
  }

  return NextResponse.json({ ok: true });
}
