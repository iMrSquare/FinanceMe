import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getUserById, updateUserAvatar, clearUserAvatar } from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const AVATARS_DIR = () => path.join(process.cwd(), 'data', 'avatars');

async function deleteAvatarFile(avatarUrl: string) {
  try {
    await unlink(path.join(AVATARS_DIR(), path.basename(avatarUrl)));
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

  await mkdir(AVATARS_DIR(), { recursive: true });

  const filename = `user-${session.id}.${ext}`;
  await writeFile(path.join(AVATARS_DIR(), filename), Buffer.from(await file.arrayBuffer()));

  // Delete old file if extension changed
  if (currentUser?.avatar_url && path.basename(currentUser.avatar_url) !== filename) {
    await deleteAvatarFile(currentUser.avatar_url);
  }

  updateUserAvatar(session.id, `/api/avatars/${filename}`);
  await refreshSession(session.id);

  return NextResponse.json({ ok: true, avatarUrl: `/api/avatars/${filename}` });
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
