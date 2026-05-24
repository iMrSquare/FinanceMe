import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getAllUsers, createUser, deleteUser, countAdminUsers, getUserById } from '@/lib/db';
import { validateUsername, validatePassword } from '@/lib/validation';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  return NextResponse.json(getAllUsers());
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { nombre, username, password, role } = await request.json();
  if (!nombre?.trim() || !username || !password || !role) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  if (!['admin', 'editor', 'visor'].includes(role)) {
    return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
  }

  const usernameErr = validateUsername(username);
  if (usernameErr) return NextResponse.json({ error: usernameErr }, { status: 400 });

  const passwordErr = validatePassword(password);
  if (passwordErr) return NextResponse.json({ error: passwordErr }, { status: 400 });

  try {
    createUser(nombre.trim(), username, hashPassword(password), role);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  if (id === session.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });

  const target = getUserById(id);
  if (target?.role === 'admin' && countAdminUsers() <= 1) {
    return NextResponse.json({ error: 'No se puede eliminar el último administrador' }, { status: 400 });
  }

  deleteUser(id);
  return NextResponse.json({ ok: true });
}
