import { NextResponse } from 'next/server';
import { getSession, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { createToken } from '@/lib/auth-edge';
import { getUserById, markTutorialSeen } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const user = getUserById(session.id);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  markTutorialSeen(session.id);

  // Reissue cookie with tutorialSeen: true so the modal doesn't reappear on next navigation.
  // Preserve must_change_password (unlike change-password, which clears it).
  const token = await createToken({
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatar_url,
    mustChangePassword: user.must_change_password === 1,
    tutorialSeen: true,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
