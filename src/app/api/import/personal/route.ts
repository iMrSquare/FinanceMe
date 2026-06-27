import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (body.type !== 'personal') return NextResponse.json({ error: 'El fichero no es de tipo personal' }, { status: 400 });

  const {
    categorias = [], bancos = [], gastos_fijos = [], ingresos_fijos = [], suscripciones = [],
    ahorro = [], ahorro_mes = [], ahorro_objetivos = [],
    meses = [], gastos_mes = [], ingresos_mes = [], presupuesto_auto = [],
  } = (body.data ?? {}) as Record<string, unknown[]>;

  const db = getDb();
  const userId = session.id;
  let importado = 0;

  try {
    db.transaction(() => {
      // ── Categorías (upsert por user_id+nombre, actualiza color) ────────
      for (const c of categorias as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_categorias (user_id, nombre, color) VALUES (?, ?, ?) ON CONFLICT(user_id, nombre) DO UPDATE SET color = excluded.color').run(userId, c.nombre, c.color);
        importado++;
      }

      // ── Bancos (upsert por user_id+nombre, actualiza color) ─────────────
      for (const b of bancos as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_bancos (user_id, nombre, color) VALUES (?, ?, ?) ON CONFLICT(user_id, nombre) DO UPDATE SET color = excluded.color').run(userId, b.nombre, b.color);
        importado++;
      }

      // ── Gastos fijos (siempre insertar) ─────────────────────────────────
      for (const g of gastos_fijos as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_gastos_fijos (user_id, gasto, importe, categoria, banco, cobro, vencimiento, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(userId, g.gasto, g.importe, g.categoria ?? null, g.banco ?? null, g.cobro ?? null, g.vencimiento ?? null, g.comentario ?? null);
        importado++;
      }

      // ── Ingresos fijos (siempre insertar) ───────────────────────────────
      for (const i of ingresos_fijos as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_ingresos_fijos (user_id, concepto, importe, comentario) VALUES (?, ?, ?, ?)').run(userId, i.concepto, i.importe, i.comentario ?? null);
        importado++;
      }

      // ── Suscripciones (siempre insertar) ────────────────────────────────
      for (const s of suscripciones as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_suscripciones (user_id, nombre, importe, cobro, periodicidad, comentario) VALUES (?, ?, ?, ?, ?, ?)').run(userId, s.nombre, s.importe, s.cobro ?? null, s.periodicidad, s.comentario ?? null);
        importado++;
      }

      // ── Ahorro (upsert por user_id+anio, actualiza objetivo_anual) ────
      const ahorroIdMap: Record<number, number> = {};
      for (const a of ahorro as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_ahorro (user_id, anio, objetivo_anual) VALUES (?, ?, ?) ON CONFLICT(user_id, anio) DO UPDATE SET objetivo_anual = excluded.objetivo_anual').run(userId, a.anio, a.objetivo_anual);
        const row = db.prepare('SELECT id FROM personal_ahorro WHERE user_id = ? AND anio = ?').get(userId, a.anio) as { id: number };
        ahorroIdMap[a.id as number] = row.id;
        importado++;
      }
      for (const am of ahorro_mes as Array<Record<string, unknown>>) {
        const newId = ahorroIdMap[am.ahorro_id as number];
        if (!newId) continue;
        db.prepare('INSERT OR REPLACE INTO personal_ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, ?)').run(newId, am.mes, am.aportado);
        importado++;
      }

      // ── Objetivos de ahorro (siempre insertar) ──────────────────────────
      for (const o of ahorro_objetivos as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_ahorro_objetivos (user_id, nombre, objetivo, fecha_objetivo, aportado) VALUES (?, ?, ?, ?, ?)').run(userId, o.nombre, o.objetivo, o.fecha_objetivo, o.aportado ?? 0);
        importado++;
      }

      // ── Meses (upsert — ignore if already exists) ────────────────────────
      for (const m of meses as Array<Record<string, unknown>>) {
        db.prepare('INSERT OR IGNORE INTO personal_meses (user_id, mes, anio) VALUES (?, ?, ?)').run(userId, m.mes, m.anio);
        importado++;
      }

      // ── Gastos y ingresos del mes: borrar+reinsertar por (anio,mes) ───────
      const mesKeysSeen = new Set<string>();
      for (const g of gastos_mes as Array<Record<string, unknown>>) {
        const key = `${g.anio}-${g.mes}`;
        if (!mesKeysSeen.has(key)) {
          db.prepare('DELETE FROM personal_gastos_mes WHERE user_id = ? AND anio = ? AND mes = ?').run(userId, g.anio, g.mes);
          mesKeysSeen.add(key);
        }
        db.prepare('INSERT INTO personal_gastos_mes (user_id, anio, mes, concepto, importe, categoria, banco, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, g.anio, g.mes, g.concepto, g.importe, g.categoria ?? null, g.banco ?? null, g.fecha ?? null, g.comentario ?? null);
        importado++;
      }

      const ingKeysSeen = new Set<string>();
      for (const i of ingresos_mes as Array<Record<string, unknown>>) {
        const key = `${i.anio}-${i.mes}`;
        if (!ingKeysSeen.has(key)) {
          db.prepare('DELETE FROM personal_ingresos_mes WHERE user_id = ? AND anio = ? AND mes = ?').run(userId, i.anio, i.mes);
          ingKeysSeen.add(key);
        }
        db.prepare('INSERT INTO personal_ingresos_mes (user_id, anio, mes, concepto, importe, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, i.anio, i.mes, i.concepto, i.importe, i.fecha ?? null, i.comentario ?? null);
        importado++;
      }

      // ── Presupuesto auto (upsert por user_id+tipo) ───────────────────────
      for (const p of presupuesto_auto as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO personal_presupuesto_auto (user_id, tipo, banco, categoria) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, tipo) DO UPDATE SET banco = excluded.banco, categoria = excluded.categoria').run(userId, p.tipo, p.banco ?? null, p.categoria ?? null);
        importado++;
      }
    })();

    return NextResponse.json({ ok: true, importado });
  } catch (err) {
    console.error('[import/personal]', err);
    return NextResponse.json({ error: 'Error al importar los datos' }, { status: 500 });
  }
}
