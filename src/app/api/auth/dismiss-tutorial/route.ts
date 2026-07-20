import { NextResponse } from 'next/server';
import { getSession, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { createToken } from '@/lib/auth-edge';
import { getUserById, markTutorialSeen, toSessionUser } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  markTutorialSeen(session.id);

  // Reissue cookie with fresh DB state (tutorialSeen: true) so the modal doesn't reappear.
  const user = getUserById(session.id);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const token = await createToken(toSessionUser(user));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
