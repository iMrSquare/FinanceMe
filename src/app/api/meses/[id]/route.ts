import { NextResponse } from 'next/server';
import { requireEditor, verifyPassword } from '@/lib/auth';
import { deleteMes, getDb, getUserById, isMesBloqueado } from '@/lib/db';

// Elimina el mes de Hogar y todos sus movimientos. Exige la contraseña de quien lo borra
// y que el mes esté desbloqueado
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;
  const id = Number((await params).id);
  if (!getDb().prepare('SELECT 1 FROM meses WHERE id = ?').get(id)) return NextResponse.json({ error: 'El mes no existe' }, { status: 404 });
  if (isMesBloqueado(id)) {
    return NextResponse.json({ error: 'El mes está bloqueado: desbloquéalo antes de eliminarlo' }, { status: 409 });
  }
  const { password } = await req.json().catch(() => ({}));
  const user = getUserById(auth.id);
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'La contraseña no es correcta' }, { status: 403 });
  }
  deleteMes(id);
  return NextResponse.json({ ok: true });
}
