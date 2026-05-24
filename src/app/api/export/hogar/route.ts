import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { APP_VERSION } from '@/lib/constants';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = getDb();

  const payload = {
    version: APP_VERSION,
    type: 'hogar',
    exportedAt: new Date().toISOString(),
    data: {
      meses:        db.prepare('SELECT * FROM meses ORDER BY anio, mes').all(),
      ingresos:     db.prepare('SELECT * FROM ingresos ORDER BY id').all(),
      gastos:       db.prepare('SELECT * FROM gastos ORDER BY id').all(),
      prestamos:    db.prepare('SELECT * FROM prestamos ORDER BY id').all(),
      categorias:   db.prepare('SELECT * FROM categorias ORDER BY id').all(),
      fijos:        db.prepare('SELECT * FROM fijos ORDER BY id').all(),
      registro_luz: db.prepare('SELECT * FROM registro_luz ORDER BY anio, id').all(),
      registro_agua:db.prepare('SELECT * FROM registro_agua ORDER BY anio, id').all(),
    },
  };

  const date = new Date().toISOString().split('T')[0];
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="hogar-backup-${date}.json"`,
    },
  });
}
