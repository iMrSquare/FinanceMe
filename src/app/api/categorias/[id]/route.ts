import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, color, nombreAnterior, tipo } = await req.json();
  const db = getDb();
  db.prepare('UPDATE categorias SET nombre=?, color=? WHERE id=?').run(nombre, color, id);
  // Cascade rename to existing rows
  if (nombreAnterior && nombreAnterior !== nombre && tipo) {
    const table = tipo === 'gasto' ? 'gastos' : 'prestamos';
    db.prepare(`UPDATE ${table} SET categoria=? WHERE categoria=?`).run(nombre, nombreAnterior);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM categorias WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
