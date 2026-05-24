import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyPassword, hashPassword, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { createToken } from '@/lib/auth-edge';
import { getUserById, updateUserPassword } from '@/lib/db';
import { validatePassword } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!newPassword) return NextResponse.json({ error: 'La nueva contraseña es requerida' }, { status: 400 });

  const user = getUserById(session.id);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Check DB directly — more reliable than JWT for forced-change flag
  if (user.must_change_password !== 1) {
    if (!currentPassword) return NextResponse.json({ error: 'La contraseña actual es requerida' }, { status: 400 });
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }
  }

  const passwordErr = validatePassword(newPassword);
  if (passwordErr) return NextResponse.json({ error: passwordErr }, { status: 400 });

  updateUserPassword(session.id, hashPassword(newPassword));

  // Issue a new token without mustChangePassword flag
  const token = await createToken({
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatar_url,
    mustChangePassword: false,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
