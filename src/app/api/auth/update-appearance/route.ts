import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getUserById, updateUserAppearance, updateUserModoInicio, toSessionUser } from '@/lib/db';

const THEMES = ['institucional', 'ambar', 'rosa', 'contraste'];
const COLOR_MODES = ['light', 'dark', 'system'];
const HEX_RE = /^#[0-9a-f]{6}$/i;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { theme, colorMode, accentPersonal, accentHogar, modoInicio } = await request.json();

  if (!THEMES.includes(theme)) {
    return NextResponse.json({ error: 'Tema no válido' }, { status: 400 });
  }
  if (!COLOR_MODES.includes(colorMode)) {
    return NextResponse.json({ error: 'Modo de color no válido' }, { status: 400 });
  }
  if (accentPersonal !== null && !HEX_RE.test(accentPersonal ?? '')) {
    return NextResponse.json({ error: 'Color de acento Personal no válido' }, { status: 400 });
  }
  if (accentHogar !== null && !HEX_RE.test(accentHogar ?? '')) {
    return NextResponse.json({ error: 'Color de acento Hogar no válido' }, { status: 400 });
  }

  if (modoInicio !== undefined && modoInicio !== 'personal' && modoInicio !== 'hogar') {
    return NextResponse.json({ error: 'Modo de inicio no válido' }, { status: 400 });
  }

  updateUserAppearance(session.id, { theme, colorMode, accentPersonal, accentHogar });
  if (modoInicio) updateUserModoInicio(session.id, modoInicio);

  const user = getUserById(session.id);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  await setSessionCookie(toSessionUser(user));

  return NextResponse.json({ ok: true, theme, colorMode, accentPersonal, accentHogar });
}
