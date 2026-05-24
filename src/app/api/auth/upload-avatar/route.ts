import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getUserById, updateUserAvatar } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) {
    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
  }

  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  await mkdir(avatarsDir, { recursive: true });

  const filename = `user-${session.id}-${Date.now()}.${ext}`;
  const filepath = path.join(avatarsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const avatarUrl = `/avatars/${filename}`;
  updateUserAvatar(session.id, avatarUrl);

  const user = getUserById(session.id);
  if (user) {
    await setSessionCookie({ id: user.id, username: user.username, nombre: user.nombre, role: user.role, avatarUrl: user.avatar_url });
  }

  return NextResponse.json({ ok: true, avatarUrl });
}
