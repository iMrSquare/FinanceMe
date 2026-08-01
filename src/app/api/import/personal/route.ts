import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Lanzada al final de una pasada en modo "check" para forzar que better-sqlite3
// revierta la transacción sin persistir nada — así la detección de duplicados
// reutiliza exactamente la misma lógica que la importación real.
class RollbackCheck extends Error {}

interface ImportResult {
  importado: number;
  duplicates: number;
  breakdown: Record<string, number>;
}

function runImport(
  data: Record<string, unknown[]>,
  userId: number,
  opts: { commit: boolean; overwrite: boolean },
): ImportResult {
  const {
    categorias = [], bancos = [], gastos_fijos = [], ingresos_fijos = [], suscripciones = [],
    ahorro = [], ahorro_mes = [], ahorro_objetivos = [],
    meses = [], gastos_mes = [], ingresos_mes = [], presupuesto_auto = [],
  } = data;

  const db = getDb();
  let importado = 0;
  let duplicates = 0;
  const breakdown: Record<string, number> = {};
  const bump = (key: string) => { duplicates++; breakdown[key] = (breakdown[key] ?? 0) + 1; };

  const txn = db.transaction(() => {
    // ── Categorías (dedup por user_id+nombre) ───────────────────────────
    for (const c of categorias as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_categorias WHERE user_id = ? AND nombre = ?').get(userId, c.nombre) as { id: number } | undefined;
      if (existing) {
        bump('categorias');
        if (opts.overwrite) { db.prepare('UPDATE personal_categorias SET color = ? WHERE id = ?').run(c.color, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO personal_categorias (user_id, nombre, color) VALUES (?, ?, ?)').run(userId, c.nombre, c.color);
        importado++;
      }
    }

    // ── Bancos (dedup por user_id+nombre) ────────────────────────────────
    for (const b of bancos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_bancos WHERE user_id = ? AND nombre = ?').get(userId, b.nombre) as { id: number } | undefined;
      if (existing) {
        bump('bancos');
        if (opts.overwrite) { db.prepare('UPDATE personal_bancos SET color = ? WHERE id = ?').run(b.color, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO personal_bancos (user_id, nombre, color) VALUES (?, ?, ?)').run(userId, b.nombre, b.color);
        importado++;
      }
    }

    // ── Gastos fijos (dedup por user_id+gasto) ───────────────────────────
    for (const g of gastos_fijos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_gastos_fijos WHERE user_id = ? AND gasto = ?').get(userId, g.gasto) as { id: number } | undefined;
      if (existing) {
        bump('gastos_fijos');
        if (opts.overwrite) {
          db.prepare('UPDATE personal_gastos_fijos SET importe = ?, categoria = ?, banco = ?, cobro = ?, vencimiento = ?, comentario = ? WHERE id = ?')
            .run(g.importe, g.categoria ?? null, g.banco ?? null, g.cobro ?? null, g.vencimiento ?? null, g.comentario ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO personal_gastos_fijos (user_id, gasto, importe, categoria, banco, cobro, vencimiento, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(userId, g.gasto, g.importe, g.categoria ?? null, g.banco ?? null, g.cobro ?? null, g.vencimiento ?? null, g.comentario ?? null);
        importado++;
      }
    }

    // ── Ingresos fijos (dedup por user_id+concepto) ──────────────────────
    for (const i of ingresos_fijos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_ingresos_fijos WHERE user_id = ? AND concepto = ?').get(userId, i.concepto) as { id: number } | undefined;
      if (existing) {
        bump('ingresos_fijos');
        if (opts.overwrite) { db.prepare('UPDATE personal_ingresos_fijos SET importe = ?, comentario = ? WHERE id = ?').run(i.importe, i.comentario ?? null, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO personal_ingresos_fijos (user_id, concepto, importe, comentario) VALUES (?, ?, ?, ?)').run(userId, i.concepto, i.importe, i.comentario ?? null);
        importado++;
      }
    }

    // ── Suscripciones (dedup por user_id+nombre) ─────────────────────────
    for (const s of suscripciones as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_suscripciones WHERE user_id = ? AND nombre = ?').get(userId, s.nombre) as { id: number } | undefined;
      if (existing) {
        bump('suscripciones');
        if (opts.overwrite) {
          db.prepare('UPDATE personal_suscripciones SET importe = ?, cobro = ?, periodicidad = ?, comentario = ? WHERE id = ?')
            .run(s.importe, s.cobro ?? null, s.periodicidad, s.comentario ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO personal_suscripciones (user_id, nombre, importe, cobro, periodicidad, comentario) VALUES (?, ?, ?, ?, ?, ?)')
          .run(userId, s.nombre, s.importe, s.cobro ?? null, s.periodicidad, s.comentario ?? null);
        importado++;
      }
    }

    // ── Ahorro (dedup por user_id+anio) + mapeo de ids para ahorro_mes ──
    const ahorroIdMap: Record<number, number> = {};
    for (const a of ahorro as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_ahorro WHERE user_id = ? AND anio = ?').get(userId, a.anio) as { id: number } | undefined;
      if (existing) {
        bump('ahorro');
        if (opts.overwrite) { db.prepare('UPDATE personal_ahorro SET objetivo_anual = ? WHERE id = ?').run(a.objetivo_anual, existing.id); importado++; }
        ahorroIdMap[a.id as number] = existing.id;
      } else {
        const res = db.prepare('INSERT INTO personal_ahorro (user_id, anio, objetivo_anual) VALUES (?, ?, ?)').run(userId, a.anio, a.objetivo_anual);
        ahorroIdMap[a.id as number] = Number(res.lastInsertRowid);
        importado++;
      }
    }
    for (const am of ahorro_mes as Array<Record<string, unknown>>) {
      const newId = ahorroIdMap[am.ahorro_id as number];
      if (!newId) continue; // el año correspondiente no venía en este archivo
      const existing = db.prepare('SELECT id FROM personal_ahorro_mes WHERE ahorro_id = ? AND mes = ?').get(newId, am.mes) as { id: number } | undefined;
      if (existing) {
        bump('ahorro_mes');
        if (opts.overwrite) { db.prepare('UPDATE personal_ahorro_mes SET aportado = ? WHERE id = ?').run(am.aportado, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO personal_ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, ?)').run(newId, am.mes, am.aportado);
        importado++;
      }
    }

    // ── Objetivos de ahorro (dedup por user_id+nombre) ───────────────────
    for (const o of ahorro_objetivos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_ahorro_objetivos WHERE user_id = ? AND nombre = ?').get(userId, o.nombre) as { id: number } | undefined;
      if (existing) {
        bump('ahorro_objetivos');
        if (opts.overwrite) {
          db.prepare('UPDATE personal_ahorro_objetivos SET objetivo = ?, fecha_objetivo = ?, aportado = ?, emoji = ? WHERE id = ?')
            .run(o.objetivo, o.fecha_objetivo, o.aportado ?? 0, o.emoji ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO personal_ahorro_objetivos (user_id, nombre, objetivo, fecha_objetivo, aportado, emoji) VALUES (?, ?, ?, ?, ?, ?)')
          .run(userId, o.nombre, o.objetivo, o.fecha_objetivo, o.aportado ?? 0, o.emoji ?? null);
        importado++;
      }
    }

    // ── Meses (dedup por user_id+mes+anio) ───────────────────────────────
    // Los meses ya existentes antes de esta importación determinan qué grupos
    // de gastos_mes/ingresos_mes se tratan como "duplicados" más abajo.
    const existingMonthKeys = new Set(
      (db.prepare('SELECT anio, mes FROM personal_meses WHERE user_id = ?').all(userId) as { anio: number; mes: number }[])
        .map(r => `${r.anio}-${r.mes}`)
    );
    for (const m of meses as Array<Record<string, unknown>>) {
      const key = `${m.anio}-${m.mes}`;
      if (existingMonthKeys.has(key)) {
        bump('meses');
        if (opts.overwrite && m.bloqueado != null) {
          db.prepare('UPDATE personal_meses SET bloqueado = ? WHERE user_id = ? AND mes = ? AND anio = ?').run(m.bloqueado, userId, m.mes, m.anio);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO personal_meses (user_id, mes, anio, bloqueado) VALUES (?, ?, ?, ?)').run(userId, m.mes, m.anio, m.bloqueado ?? 0);
        importado++;
      }
    }

    // ── Gastos/ingresos del mes: se tratan como duplicado a nivel de mes ──
    const gastosDupMonths = new Set<string>();
    for (const g of gastos_mes as Array<Record<string, unknown>>) {
      const key = `${g.anio}-${g.mes}`;
      const isDuplicateMonth = existingMonthKeys.has(key);
      if (isDuplicateMonth) {
        if (!gastosDupMonths.has(key)) { bump('gastos_mes'); gastosDupMonths.add(key); }
        if (!opts.overwrite) continue;
        if (!gastosDupMonths.has(`cleared:${key}`)) {
          db.prepare('DELETE FROM personal_gastos_mes WHERE user_id = ? AND anio = ? AND mes = ?').run(userId, g.anio, g.mes);
          gastosDupMonths.add(`cleared:${key}`);
        }
      }
      db.prepare('INSERT INTO personal_gastos_mes (user_id, anio, mes, concepto, importe, categoria, banco, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(userId, g.anio, g.mes, g.concepto, g.importe, g.categoria ?? null, g.banco ?? null, g.fecha ?? null, g.comentario ?? null);
      importado++;
    }

    const ingresosDupMonths = new Set<string>();
    for (const i of ingresos_mes as Array<Record<string, unknown>>) {
      const key = `${i.anio}-${i.mes}`;
      const isDuplicateMonth = existingMonthKeys.has(key);
      if (isDuplicateMonth) {
        if (!ingresosDupMonths.has(key)) { bump('ingresos_mes'); ingresosDupMonths.add(key); }
        if (!opts.overwrite) continue;
        if (!ingresosDupMonths.has(`cleared:${key}`)) {
          db.prepare('DELETE FROM personal_ingresos_mes WHERE user_id = ? AND anio = ? AND mes = ?').run(userId, i.anio, i.mes);
          ingresosDupMonths.add(`cleared:${key}`);
        }
      }
      db.prepare('INSERT INTO personal_ingresos_mes (user_id, anio, mes, concepto, importe, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(userId, i.anio, i.mes, i.concepto, i.importe, i.fecha ?? null, i.comentario ?? null);
      importado++;
    }

    // ── Presupuesto auto (dedup por user_id+tipo) ────────────────────────
    for (const p of presupuesto_auto as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM personal_presupuesto_auto WHERE user_id = ? AND tipo = ?').get(userId, p.tipo) as { id: number } | undefined;
      if (existing) {
        bump('presupuesto_auto');
        if (opts.overwrite) { db.prepare('UPDATE personal_presupuesto_auto SET banco = ?, categoria = ? WHERE id = ?').run(p.banco ?? null, p.categoria ?? null, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO personal_presupuesto_auto (user_id, tipo, banco, categoria) VALUES (?, ?, ?, ?)').run(userId, p.tipo, p.banco ?? null, p.categoria ?? null);
        importado++;
      }
    }

    if (!opts.commit) throw new RollbackCheck();
  });

  try {
    txn();
  } catch (err) {
    if (!(err instanceof RollbackCheck)) throw err;
  }

  return { importado, duplicates, breakdown };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (body.type !== 'personal') return NextResponse.json({ error: 'El fichero no es de tipo personal' }, { status: 400 });

  const data = (body.data ?? {}) as Record<string, unknown[]>;
  const mode = body.mode === 'check' ? 'check' : 'apply';
  const overwrite = body.overwrite === true;

  try {
    if (mode === 'check') {
      const { duplicates, breakdown } = runImport(data, session.id, { commit: false, overwrite: true });
      return NextResponse.json({ ok: true, duplicates, breakdown });
    }
    const { importado } = runImport(data, session.id, { commit: true, overwrite });
    return NextResponse.json({ ok: true, importado });
  } catch (err) {
    console.error('[import/personal]', err);
    return NextResponse.json({ error: 'Error al importar los datos' }, { status: 500 });
  }
}
