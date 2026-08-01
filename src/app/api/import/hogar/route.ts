import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, canEdit } from '@/lib/auth';

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
  opts: { commit: boolean; overwrite: boolean },
): ImportResult {
  const {
    meses = [], ingresos = [], gastos = [], prestamos = [], categorias = [], fijos = [],
    registro_luz = [], registro_agua = [], ahorro = [], ahorro_mes = [],
    ahorro_objetivos = [], presupuesto_auto = [],
  } = data;

  const db = getDb();
  let importado = 0;
  let duplicates = 0;
  const breakdown: Record<string, number> = {};
  const bump = (key: string) => { duplicates++; breakdown[key] = (breakdown[key] ?? 0) + 1; };

  const txn = db.transaction(() => {
    // ── Categorías + compañías luz/agua (dedup por tipo+nombre) ──────────
    for (const c of categorias as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM categorias WHERE tipo = ? AND nombre = ?').get(c.tipo, c.nombre) as { id: number } | undefined;
      if (existing) {
        bump('categorias');
        if (opts.overwrite) { db.prepare('UPDATE categorias SET color = ? WHERE id = ?').run(c.color, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO categorias (tipo, nombre, color) VALUES (?, ?, ?)').run(c.tipo, c.nombre, c.color);
        importado++;
      }
    }

    // ── Fijos (dedup por tipo+gasto) ──────────────────────────────────────
    for (const f of fijos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM fijos WHERE tipo = ? AND gasto = ?').get(f.tipo, f.gasto) as { id: number } | undefined;
      if (existing) {
        bump('fijos');
        if (opts.overwrite) {
          db.prepare('UPDATE fijos SET categoria = ?, banco = ?, importe = ?, comentario = ?, cobro = ?, vencimiento = ? WHERE id = ?')
            .run(f.categoria ?? null, f.banco ?? null, f.importe, f.comentario ?? null, f.cobro ?? null, f.vencimiento ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO fijos (tipo, gasto, categoria, banco, importe, comentario, cobro, vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(f.tipo, f.gasto, f.categoria ?? null, f.banco ?? null, f.importe, f.comentario ?? null, f.cobro ?? null, f.vencimiento ?? null);
        importado++;
      }
    }

    // ── Meses: dedup por mes+anio. Si existe y no se sobrescribe, se deja
    // intacto (no se tocan sus ingresos/gastos/prestamos) ────────────────
    const mesIdMap: Record<number, number> = {};
    const duplicateMonthIds = new Set<number>();
    for (const m of meses as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM meses WHERE mes = ? AND anio = ?').get(m.mes, m.anio) as { id: number } | undefined;
      if (existing) {
        bump('meses');
        mesIdMap[m.id as number] = existing.id;
        if (opts.overwrite) {
          db.prepare('DELETE FROM ingresos WHERE mes_id = ?').run(existing.id);
          db.prepare('DELETE FROM gastos WHERE mes_id = ?').run(existing.id);
          db.prepare('DELETE FROM prestamos WHERE mes_id = ?').run(existing.id);
          if (m.bloqueado != null) db.prepare('UPDATE meses SET bloqueado = ? WHERE id = ?').run(m.bloqueado, existing.id);
          importado++;
        } else {
          duplicateMonthIds.add(m.id as number);
        }
      } else {
        const res = db.prepare('INSERT INTO meses (nombre, mes, anio, bloqueado) VALUES (?, ?, ?, ?)').run(m.nombre, m.mes, m.anio, m.bloqueado ?? 0);
        mesIdMap[m.id as number] = Number(res.lastInsertRowid);
        importado++;
      }
    }

    // ── Ingresos / Gastos / Préstamos: se omiten si su mes es un duplicado
    // y no se ha pedido sobrescribir ──────────────────────────────────────
    for (const i of ingresos as Array<Record<string, unknown>>) {
      if (duplicateMonthIds.has(i.mes_id as number)) continue;
      const newMesId = mesIdMap[i.mes_id as number];
      if (!newMesId) continue;
      db.prepare('INSERT INTO ingresos (mes_id, inquilino, aportacion, comentario) VALUES (?, ?, ?, ?)').run(newMesId, i.inquilino, i.aportacion, i.comentario ?? null);
      importado++;
    }
    for (const g of gastos as Array<Record<string, unknown>>) {
      if (duplicateMonthIds.has(g.mes_id as number)) continue;
      const newMesId = mesIdMap[g.mes_id as number];
      if (!newMesId) continue;
      db.prepare('INSERT INTO gastos (mes_id, gasto, fecha, categoria, banco, importe, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)').run(newMesId, g.gasto, g.fecha ?? null, g.categoria ?? null, g.banco ?? null, g.importe, g.comentario ?? null);
      importado++;
    }
    for (const p of prestamos as Array<Record<string, unknown>>) {
      if (duplicateMonthIds.has(p.mes_id as number)) continue;
      const newMesId = mesIdMap[p.mes_id as number];
      if (!newMesId) continue;
      db.prepare('INSERT INTO prestamos (mes_id, gasto, fecha, categoria, banco, importe, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)').run(newMesId, p.gasto, p.fecha ?? null, p.categoria ?? null, p.banco ?? null, p.importe, p.comentario ?? null);
      importado++;
    }

    // ── Registro Luz / Agua (dedup por anio+nombre) ──────────────────────
    for (const r of registro_luz as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM registro_luz WHERE anio = ? AND nombre = ?').get(r.anio, r.nombre) as { id: number } | undefined;
      if (existing) {
        bump('registro_luz');
        if (opts.overwrite) {
          db.prepare('UPDATE registro_luz SET importe = ?, kwh = ?, fecha_lectura_inicio = ?, fecha_lectura_fin = ?, fecha_cobro = ?, precio_kwh = ?, compania = ? WHERE id = ?')
            .run(r.importe, r.kwh ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.precio_kwh ?? null, r.compania ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO registro_luz (anio, nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(r.anio, r.nombre, r.importe, r.kwh ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.precio_kwh ?? null, r.compania ?? null);
        importado++;
      }
    }
    for (const r of registro_agua as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM registro_agua WHERE anio = ? AND nombre = ?').get(r.anio, r.nombre) as { id: number } | undefined;
      if (existing) {
        bump('registro_agua');
        if (opts.overwrite) {
          db.prepare('UPDATE registro_agua SET importe = ?, m3 = ?, fecha_lectura_inicio = ?, fecha_lectura_fin = ?, fecha_cobro = ?, compania = ? WHERE id = ?')
            .run(r.importe, r.m3 ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.compania ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO registro_agua (anio, nombre, importe, m3, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, compania) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(r.anio, r.nombre, r.importe, r.m3 ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.compania ?? null);
        importado++;
      }
    }

    // ── Ahorro (dedup por anio) + mapeo de ids para ahorro_mes ───────────
    const ahorroIdMap: Record<number, number> = {};
    for (const a of ahorro as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM ahorro WHERE anio = ?').get(a.anio) as { id: number } | undefined;
      if (existing) {
        bump('ahorro');
        if (opts.overwrite) { db.prepare('UPDATE ahorro SET objetivo_anual = ? WHERE id = ?').run(a.objetivo_anual, existing.id); importado++; }
        ahorroIdMap[a.id as number] = existing.id;
      } else {
        const res = db.prepare('INSERT INTO ahorro (anio, objetivo_anual) VALUES (?, ?)').run(a.anio, a.objetivo_anual);
        ahorroIdMap[a.id as number] = Number(res.lastInsertRowid);
        importado++;
      }
    }
    for (const am of ahorro_mes as Array<Record<string, unknown>>) {
      const newId = ahorroIdMap[am.ahorro_id as number];
      if (!newId) continue;
      const existing = db.prepare('SELECT id FROM ahorro_mes WHERE ahorro_id = ? AND mes = ?').get(newId, am.mes) as { id: number } | undefined;
      if (existing) {
        bump('ahorro_mes');
        if (opts.overwrite) { db.prepare('UPDATE ahorro_mes SET aportado = ? WHERE id = ?').run(am.aportado, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, ?)').run(newId, am.mes, am.aportado);
        importado++;
      }
    }

    // ── Objetivos de ahorro (dedup por nombre) ────────────────────────────
    for (const o of ahorro_objetivos as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM ahorro_objetivos WHERE nombre = ?').get(o.nombre) as { id: number } | undefined;
      if (existing) {
        bump('ahorro_objetivos');
        if (opts.overwrite) {
          db.prepare('UPDATE ahorro_objetivos SET objetivo = ?, fecha_objetivo = ?, aportado = ?, emoji = ? WHERE id = ?')
            .run(o.objetivo, o.fecha_objetivo, o.aportado ?? 0, o.emoji ?? null, existing.id);
          importado++;
        }
      } else {
        db.prepare('INSERT INTO ahorro_objetivos (nombre, objetivo, fecha_objetivo, aportado, emoji) VALUES (?, ?, ?, ?, ?)')
          .run(o.nombre, o.objetivo, o.fecha_objetivo, o.aportado ?? 0, o.emoji ?? null);
        importado++;
      }
    }

    // ── Presupuesto auto (dedup por tipo) ─────────────────────────────────
    for (const p of presupuesto_auto as Array<Record<string, unknown>>) {
      const existing = db.prepare('SELECT id FROM presupuesto_auto WHERE tipo = ?').get(p.tipo) as { id: number } | undefined;
      if (existing) {
        bump('presupuesto_auto');
        if (opts.overwrite) { db.prepare('UPDATE presupuesto_auto SET banco = ?, categoria = ? WHERE id = ?').run(p.banco ?? null, p.categoria ?? null, existing.id); importado++; }
      } else {
        db.prepare('INSERT INTO presupuesto_auto (tipo, banco, categoria) VALUES (?, ?, ?)').run(p.tipo, p.banco ?? null, p.categoria ?? null);
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
  if (!canEdit(session.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (body.type !== 'hogar') return NextResponse.json({ error: 'El fichero no es de tipo hogar' }, { status: 400 });

  const data = (body.data ?? {}) as Record<string, unknown[]>;
  const mode = body.mode === 'check' ? 'check' : 'apply';
  const overwrite = body.overwrite === true;

  try {
    if (mode === 'check') {
      const { duplicates, breakdown } = runImport(data, { commit: false, overwrite: true });
      return NextResponse.json({ ok: true, duplicates, breakdown });
    }
    const { importado } = runImport(data, { commit: true, overwrite });
    return NextResponse.json({ ok: true, importado });
  } catch (err) {
    console.error('[import/hogar]', err);
    return NextResponse.json({ error: 'Error al importar los datos' }, { status: 500 });
  }
}
