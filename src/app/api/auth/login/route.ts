import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { verifyPassword, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { createToken } from '@/lib/auth-edge';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
  }

  const user = getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const mustChangePassword = user.must_change_password === 1;
  const token = await createToken({
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatar_url,
    mustChangePassword,
  });

  const response = NextResponse.json({ ok: true, role: user.role, mustChangePassword });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
