import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, canEdit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canEdit(session.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (body.type !== 'hogar') return NextResponse.json({ error: 'El fichero no es de tipo hogar' }, { status: 400 });

  const { meses = [], ingresos = [], gastos = [], prestamos = [], categorias = [], fijos = [], registro_luz = [], registro_agua = [] } =
    (body.data ?? {}) as Record<string, unknown[]>;

  const db = getDb();
  let importado = 0;

  try {
    db.transaction(() => {
      // ── Categorías + compañías luz/agua (upsert por tipo+nombre, actualiza color) ─
      for (const c of categorias as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO categorias (tipo, nombre, color) VALUES (?, ?, ?) ON CONFLICT(tipo, nombre) DO UPDATE SET color = excluded.color').run(c.tipo, c.nombre, c.color);
        importado++;
      }

      // ── Fijos (siempre insertar) ─────────────────────────────────────────
      for (const f of fijos as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO fijos (tipo, gasto, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?)').run(f.tipo, f.gasto, f.categoria ?? null, f.importe, f.comentario ?? null);
        importado++;
      }

      // ── Meses: upsert — si existe borra sus datos para reimportarlos ───
      const mesIdMap: Record<number, number> = {};
      for (const m of meses as Array<Record<string, unknown>>) {
        const existing = db.prepare('SELECT id FROM meses WHERE mes = ? AND anio = ?').get(m.mes, m.anio) as { id: number } | null;
        if (existing) {
          db.prepare('DELETE FROM ingresos WHERE mes_id = ?').run(existing.id);
          db.prepare('DELETE FROM gastos WHERE mes_id = ?').run(existing.id);
          db.prepare('DELETE FROM prestamos WHERE mes_id = ?').run(existing.id);
          mesIdMap[m.id as number] = existing.id;
        } else {
          db.prepare('INSERT INTO meses (nombre, mes, anio) VALUES (?, ?, ?)').run(m.nombre, m.mes, m.anio);
          const row = db.prepare('SELECT id FROM meses WHERE mes = ? AND anio = ?').get(m.mes, m.anio) as { id: number };
          mesIdMap[m.id as number] = row.id;
          importado++;
        }
      }

      // ── Ingresos / Gastos / Préstamos (todos los meses del archivo) ─────
      for (const i of ingresos as Array<Record<string, unknown>>) {
        const newMesId = mesIdMap[i.mes_id as number];
        if (!newMesId) continue;
        db.prepare('INSERT INTO ingresos (mes_id, inquilino, aportacion) VALUES (?, ?, ?)').run(newMesId, i.inquilino, i.aportacion);
        importado++;
      }
      for (const g of gastos as Array<Record<string, unknown>>) {
        const newMesId = mesIdMap[g.mes_id as number];
        if (!newMesId) continue;
        db.prepare('INSERT INTO gastos (mes_id, gasto, fecha, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?, ?)').run(newMesId, g.gasto, g.fecha ?? null, g.categoria ?? null, g.importe, g.comentario ?? null);
        importado++;
      }
      for (const p of prestamos as Array<Record<string, unknown>>) {
        const newMesId = mesIdMap[p.mes_id as number];
        if (!newMesId) continue;
        db.prepare('INSERT INTO prestamos (mes_id, gasto, fecha, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?, ?)').run(newMesId, p.gasto, p.fecha ?? null, p.categoria ?? null, p.importe, p.comentario ?? null);
        importado++;
      }

      // ── Registro Luz / Agua ──────────────────────────────────────────────
      for (const r of registro_luz as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO registro_luz (anio, nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(r.anio, r.nombre, r.importe, r.kwh ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.precio_kwh ?? null, r.compania ?? null);
        importado++;
      }
      for (const r of registro_agua as Array<Record<string, unknown>>) {
        db.prepare('INSERT INTO registro_agua (anio, nombre, importe, m3, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, compania) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(r.anio, r.nombre, r.importe, r.m3 ?? null, r.fecha_lectura_inicio ?? null, r.fecha_lectura_fin ?? null, r.fecha_cobro ?? null, r.compania ?? null);
        importado++;
      }
    })();

    return NextResponse.json({ ok: true, importado });
  } catch (err) {
    console.error('[import/hogar]', err);
    return NextResponse.json({ error: 'Error al importar los datos' }, { status: 500 });
  }
}
