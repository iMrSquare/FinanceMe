import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { APP_VERSION } from '@/lib/constants';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = getDb();
  const userId = session.id;

  const payload = {
    version: APP_VERSION,
    type: 'personal',
    exportedAt: new Date().toISOString(),
    data: {
      categorias:        db.prepare('SELECT * FROM personal_categorias WHERE user_id = ? ORDER BY id').all(userId),
      bancos:            db.prepare('SELECT * FROM personal_bancos WHERE user_id = ? ORDER BY id').all(userId),
      gastos_fijos:      db.prepare('SELECT * FROM personal_gastos_fijos WHERE user_id = ? ORDER BY id').all(userId),
      suscripciones:     db.prepare('SELECT * FROM personal_suscripciones WHERE user_id = ? ORDER BY id').all(userId),
      ahorro:            db.prepare('SELECT * FROM personal_ahorro WHERE user_id = ? ORDER BY anio').all(userId),
      ahorro_mes:        db.prepare(`
        SELECT pam.* FROM personal_ahorro_mes pam
        JOIN personal_ahorro pa ON pa.id = pam.ahorro_id
        WHERE pa.user_id = ? ORDER BY pam.ahorro_id, pam.mes
      `).all(userId),
      meses:             db.prepare('SELECT * FROM personal_meses WHERE user_id = ? ORDER BY anio, mes').all(userId),
      gastos_mes:        db.prepare('SELECT * FROM personal_gastos_mes WHERE user_id = ? ORDER BY anio, mes, id').all(userId),
      ingresos_mes:      db.prepare('SELECT * FROM personal_ingresos_mes WHERE user_id = ? ORDER BY anio, mes, id').all(userId),
      presupuesto_auto:  db.prepare('SELECT * FROM personal_presupuesto_auto WHERE user_id = ? ORDER BY id').all(userId),
    },
  };

  const date = new Date().toISOString().split('T')[0];
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="personal-backup-${date}.json"`,
    },
  });
}
