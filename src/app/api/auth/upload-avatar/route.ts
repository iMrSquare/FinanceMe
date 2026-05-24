import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getUserById, updateUserAvatar, clearUserAvatar } from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

async function deleteAvatarFile(avatarUrl: string) {
  try {
    await unlink(path.join(process.cwd(), 'public', avatarUrl.replace(/^\//, '')));
  } catch { /* file may not exist */ }
}

async function refreshSession(userId: number) {
  const user = getUserById(userId);
  if (user) {
    await setSessionCookie({ id: user.id, username: user.username, nombre: user.nombre, role: user.role, avatarUrl: user.avatar_url });
  }
}

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

  const currentUser = getUserById(session.id);

  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  await mkdir(avatarsDir, { recursive: true });

  const filename = `user-${session.id}.${ext}`;
  const filepath = path.join(avatarsDir, filename);
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

  // Delete old avatar if it was a different file (e.g. different extension)
  if (currentUser?.avatar_url && currentUser.avatar_url !== `/avatars/${filename}`) {
    await deleteAvatarFile(currentUser.avatar_url);
  }

  const avatarUrl = `/avatars/${filename}`;
  updateUserAvatar(session.id, avatarUrl);
  await refreshSession(session.id);

  return NextResponse.json({ ok: true, avatarUrl });
}

export async function DELETE(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const user = getUserById(session.id);
  if (user?.avatar_url) {
    await deleteAvatarFile(user.avatar_url);
  }

  clearUserAvatar(session.id);
  await refreshSession(session.id);

  return NextResponse.json({ ok: true });
}
