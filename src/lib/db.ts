import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { mensualNecesario } from './ahorroObjetivos';

const DB_PATH = path.join(process.cwd(), 'data', 'financeme.db');

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    runMigrations(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      mes INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      UNIQUE(mes, anio)
    );

    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes_id INTEGER REFERENCES meses(id) ON DELETE CASCADE,
      inquilino TEXT NOT NULL,
      aportacion REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes_id INTEGER NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
      gasto TEXT NOT NULL,
      fecha TEXT,
      categoria TEXT,
      importe REAL DEFAULT 0,
      comentario TEXT
    );

    CREATE TABLE IF NOT EXISTS prestamos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes_id INTEGER NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
      gasto TEXT NOT NULL,
      fecha TEXT,
      categoria TEXT,
      importe REAL DEFAULT 0,
      comentario TEXT
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#e5e7eb',
      UNIQUE(tipo, nombre)
    );

    CREATE TABLE IF NOT EXISTS registro_luz (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      importe REAL DEFAULT 0,
      comentario TEXT,
      UNIQUE(mes, anio)
    );

    CREATE TABLE IF NOT EXISTS registro_agua (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      importe REAL DEFAULT 0,
      comentario TEXT,
      UNIQUE(mes, anio)
    );

    CREATE TABLE IF NOT EXISTS fijos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      gasto TEXT NOT NULL,
      categoria TEXT,
      importe REAL NOT NULL DEFAULT 0,
      comentario TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'visor' CHECK(role IN ('admin', 'editor', 'visor')),
      avatar_url TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      tutorial_seen INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      UNIQUE(user_id, nombre)
    );

    CREATE TABLE IF NOT EXISTS personal_bancos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b',
      UNIQUE(user_id, nombre)
    );

    CREATE TABLE IF NOT EXISTS personal_gastos_fijos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gasto TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      categoria TEXT,
      banco TEXT,
      cobro TEXT,
      vencimiento TEXT,
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_suscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      cobro TEXT,
      periodicidad TEXT NOT NULL DEFAULT 'mensual',
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_ahorro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      anio INTEGER NOT NULL,
      objetivo_anual REAL NOT NULL DEFAULT 0,
      UNIQUE(user_id, anio)
    );

    CREATE TABLE IF NOT EXISTS personal_ahorro_mes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ahorro_id INTEGER NOT NULL REFERENCES personal_ahorro(id) ON DELETE CASCADE,
      mes INTEGER NOT NULL,
      aportado REAL NOT NULL DEFAULT 0,
      UNIQUE(ahorro_id, mes)
    );

    CREATE TABLE IF NOT EXISTS personal_meses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mes INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      UNIQUE(user_id, mes, anio)
    );

    CREATE TABLE IF NOT EXISTS personal_gastos_mes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      categoria TEXT,
      fecha TEXT,
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_presupuesto_auto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      banco TEXT,
      categoria TEXT,
      redondeo INTEGER NOT NULL DEFAULT 1,
      UNIQUE(user_id, tipo)
    );

    CREATE TABLE IF NOT EXISTS personal_ingresos_mes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      fecha TEXT,
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_ingresos_fijos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_ahorro_objetivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      objetivo REAL NOT NULL DEFAULT 0,
      fecha_objetivo TEXT NOT NULL,
      aportado REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ahorro_objetivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      objetivo REAL NOT NULL DEFAULT 0,
      fecha_objetivo TEXT NOT NULL,
      aportado REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS presupuesto_auto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL UNIQUE,
      banco TEXT,
      categoria TEXT
    );
  `);
}

function runMigrations(db: Database.Database) {
  try {
    db.exec('ALTER TABLE ingresos ADD COLUMN mes_id INTEGER REFERENCES meses(id) ON DELETE CASCADE');
  } catch { /* already exists */ }
  db.exec('DELETE FROM ingresos WHERE mes_id IS NULL');
  db.exec('DROP TABLE IF EXISTS totales');
  for (const sql of [
    'ALTER TABLE registro_luz ADD COLUMN kwh REAL',
    'ALTER TABLE registro_luz ADD COLUMN fecha_lectura_inicio TEXT',
    'ALTER TABLE registro_luz ADD COLUMN fecha_lectura_fin TEXT',
    'ALTER TABLE registro_luz ADD COLUMN fecha_cobro TEXT',
    'ALTER TABLE registro_luz ADD COLUMN precio_kwh REAL',
    'ALTER TABLE registro_luz ADD COLUMN compania TEXT',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // Recreate registro_luz replacing mes INTEGER with nombre TEXT
  const luzCols = (db.prepare('PRAGMA table_info(registro_luz)').all() as { name: string }[]).map(c => c.name);
  if (!luzCols.includes('nombre')) {
    db.exec(`
      CREATE TABLE registro_luz_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anio INTEGER NOT NULL,
        nombre TEXT NOT NULL DEFAULT '',
        importe REAL DEFAULT 0,
        kwh REAL,
        fecha_lectura_inicio TEXT,
        fecha_lectura_fin TEXT,
        fecha_cobro TEXT,
        precio_kwh REAL,
        compania TEXT
      );
      INSERT INTO registro_luz_v2 (id, anio, nombre, importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania)
        SELECT id, anio,
          CASE mes
            WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo' WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio' WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Septiembre' WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
            ELSE CAST(mes AS TEXT) END,
          importe, kwh, fecha_lectura_inicio, fecha_lectura_fin, fecha_cobro, precio_kwh, compania
        FROM registro_luz;
      DROP TABLE registro_luz;
      ALTER TABLE registro_luz_v2 RENAME TO registro_luz;
    `);
  }

  // Recreate registro_agua with new schema (nombre, m3, reading dates, compania)
  const aguaCols = (db.prepare('PRAGMA table_info(registro_agua)').all() as { name: string }[]).map(c => c.name);
  if (!aguaCols.includes('nombre')) {
    db.exec(`
      CREATE TABLE registro_agua_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anio INTEGER NOT NULL,
        nombre TEXT NOT NULL DEFAULT '',
        importe REAL DEFAULT 0,
        m3 REAL,
        fecha_lectura_inicio TEXT,
        fecha_lectura_fin TEXT,
        fecha_cobro TEXT,
        compania TEXT
      );
      INSERT INTO registro_agua_v2 (id, anio, nombre, importe)
        SELECT id, anio, CAST(mes AS TEXT), importe FROM registro_agua;
      DROP TABLE registro_agua;
      ALTER TABLE registro_agua_v2 RENAME TO registro_agua;
    `);
  }

  // Migration: add must_change_password column to existing databases
  try {
    db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
  } catch {}

  // Migration: add tutorial_seen column to existing databases
  try {
    db.exec('ALTER TABLE users ADD COLUMN tutorial_seen INTEGER NOT NULL DEFAULT 0');
  } catch {}

  // Migration: add redondeo column to personal_presupuesto_auto
  try {
    db.exec('ALTER TABLE personal_presupuesto_auto ADD COLUMN redondeo INTEGER NOT NULL DEFAULT 1');
  } catch {}

  // Migration: add version_seen column to existing databases.
  // Backfilled to an old version so existing users see the "new version"
  // badge once when this feature itself is deployed.
  try {
    db.exec("ALTER TABLE users ADD COLUMN version_seen TEXT NOT NULL DEFAULT 'v1.0.0'");
  } catch {}

  // Migration: add banco column to personal_gastos_mes
  try { db.exec('ALTER TABLE personal_gastos_mes ADD COLUMN banco TEXT'); } catch {}

  // Migration: add banco to gastos and prestamos, comentario to ingresos
  for (const sql of [
    'ALTER TABLE gastos ADD COLUMN banco TEXT',
    'ALTER TABLE prestamos ADD COLUMN banco TEXT',
    'ALTER TABLE ingresos ADD COLUMN comentario TEXT',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // Migration: add cobro, vencimiento and banco to fijos
  for (const sql of [
    'ALTER TABLE fijos ADD COLUMN cobro TEXT',
    'ALTER TABLE fijos ADD COLUMN vencimiento TEXT',
    'ALTER TABLE fijos ADD COLUMN banco TEXT',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // Migration: convert prestamo fijos → gasto with 'Préstamo' category
  db.exec(`
    INSERT INTO categorias (tipo, nombre, color)
    SELECT 'gasto', 'Préstamo', '#3b82f6'
    WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE tipo='gasto' AND nombre='Préstamo');
    UPDATE fijos SET tipo='gasto', categoria='Préstamo' WHERE tipo='prestamo';
  `);

  // Migration: move prestamos → gastos (new UI no longer has a separate prestamos section)
  db.exec(`
    INSERT INTO gastos (mes_id, gasto, fecha, categoria, importe, comentario, banco)
    SELECT mes_id, gasto, fecha, COALESCE(categoria, 'Préstamo'), importe, comentario, banco
    FROM prestamos;
    DELETE FROM prestamos;
  `);

  // Seed default admin user if no users exist
  const userCount = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
  if (userCount === 0) {
    const crypto = require('crypto') as typeof import('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
    db.prepare(
      'INSERT INTO users (nombre, username, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?)'
    ).run('Administrador', 'admin', `${salt}:${hash}`, 'admin', 1);
  }
}

// Types
export interface Mes {
  id: number;
  nombre: string;
  mes: number;
  anio: number;
}

export interface Ingreso {
  id: number;
  mes_id: number;
  inquilino: string;
  aportacion: number;
  comentario: string | null;
}

export interface Gasto {
  id: number;
  mes_id: number;
  gasto: string;
  fecha: string | null;
  categoria: string | null;
  banco: string | null;
  importe: number;
  comentario: string | null;
}

export interface Prestamo {
  id: number;
  mes_id: number;
  gasto: string;
  fecha: string | null;
  categoria: string | null;
  banco: string | null;
  importe: number;
  comentario: string | null;
}

export interface Categoria {
  id: number;
  tipo: 'gasto' | 'prestamo' | 'luz' | 'agua';
  nombre: string;
  color: string;
}

export interface RegistroAgua {
  id: number;
  anio: number;
  nombre: string;
  importe: number;
  m3: number | null;
  fecha_lectura_inicio: string | null;
  fecha_lectura_fin: string | null;
  fecha_cobro: string | null;
  compania: string | null;
}

export interface RegistroLuz {
  id: number;
  anio: number;
  nombre: string;
  importe: number;
  kwh: number | null;
  fecha_lectura_inicio: string | null;
  fecha_lectura_fin: string | null;
  fecha_cobro: string | null;
  precio_kwh: number | null;
  compania: string | null;
}

export interface Fijo {
  id: number;
  tipo: 'gasto' | 'prestamo' | 'ingreso';
  gasto: string;
  categoria: string | null;
  banco: string | null;
  importe: number;
  cobro: string | null;
  vencimiento: string | null;
  comentario: string | null;
}

export interface RegistroServicio {
  id: number;
  anio: number;
  mes: number;
  importe: number;
  comentario: string | null;
}

const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function getNombreMes(mes: number, anio: number): string {
  return `${NOMBRES_MESES[mes - 1]} ${anio}`;
}

export function getMeses(): Mes[] {
  const db = getDb();
  return db.prepare('SELECT * FROM meses ORDER BY anio DESC, mes DESC').all() as Mes[];
}

export function getMes(mes: number, anio: number): Mes | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM meses WHERE mes = ? AND anio = ?').get(mes, anio) as Mes | undefined;
}

export function getOrCreateMes(mes: number, anio: number): Mes {
  const db = getDb();
  const existing = getMes(mes, anio);
  if (existing) return existing;
  const nombre = getNombreMes(mes, anio);
  db.prepare('INSERT INTO meses (nombre, mes, anio) VALUES (?, ?, ?)').run(nombre, mes, anio);
  return getMes(mes, anio)!;
}

export function getGastos(mesId: number): Gasto[] {
  const db = getDb();
  return db.prepare('SELECT * FROM gastos WHERE mes_id = ? ORDER BY fecha ASC, id ASC').all(mesId) as Gasto[];
}

export function getPrestamos(mesId: number): Prestamo[] {
  const db = getDb();
  return db.prepare('SELECT * FROM prestamos WHERE mes_id = ? ORDER BY fecha ASC, id ASC').all(mesId) as Prestamo[];
}

export function getIngresos(mesId: number): Ingreso[] {
  const db = getDb();
  return db.prepare('SELECT * FROM ingresos WHERE mes_id = ? ORDER BY id ASC').all(mesId) as Ingreso[];
}

export function getCategorias(tipo: 'gasto' | 'prestamo' | 'luz' | 'agua'): Categoria[] {
  const db = getDb();
  return db.prepare('SELECT * FROM categorias WHERE tipo = ? ORDER BY id ASC').all(tipo) as Categoria[];
}

export function getFijos(tipo: 'gasto' | 'prestamo' | 'ingreso'): Fijo[] {
  const db = getDb();
  db.prepare("DELETE FROM fijos WHERE vencimiento IS NOT NULL AND substr(vencimiento, 1, 10) < ?").run(todayIso());
  return db.prepare('SELECT * FROM fijos WHERE tipo = ? ORDER BY id ASC').all(tipo) as Fijo[];
}

export function createFijo(tipo: 'gasto' | 'prestamo' | 'ingreso', gasto: string, categoria: string | null, banco: string | null, importe: number, comentario: string | null, cobro: string | null, vencimiento: string | null): Fijo {
  const db = getDb();
  const result = db.prepare('INSERT INTO fijos (tipo, gasto, categoria, banco, importe, comentario, cobro, vencimiento) VALUES (?,?,?,?,?,?,?,?)').run(tipo, gasto, categoria, banco, importe, comentario, cobro, vencimiento);
  return db.prepare('SELECT * FROM fijos WHERE id = ?').get(result.lastInsertRowid) as Fijo;
}

export function updateFijo(id: number, gasto: string, categoria: string | null, banco: string | null, importe: number, comentario: string | null, cobro: string | null, vencimiento: string | null) {
  const db = getDb();
  db.prepare('UPDATE fijos SET gasto=?, categoria=?, banco=?, importe=?, comentario=?, cobro=?, vencimiento=? WHERE id=?').run(gasto, categoria, banco, importe, comentario, cobro, vencimiento, id);
}

export function deleteFijo(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM fijos WHERE id=?').run(id);
}

export function clearMesData(mesId: number) {
  const db = getDb();
  db.prepare('DELETE FROM gastos WHERE mes_id = ?').run(mesId);
  db.prepare('DELETE FROM prestamos WHERE mes_id = ?').run(mesId);
  db.prepare('DELETE FROM ingresos WHERE mes_id = ?').run(mesId);
}

export function applyFijosToMes(mesId: number, mes: number, anio: number) {
  const db = getDb();
  const gastosFijos = db.prepare("SELECT * FROM fijos WHERE tipo='gasto'").all() as Fijo[];
  const ingresosFijos = db.prepare("SELECT * FROM fijos WHERE tipo='ingreso'").all() as Fijo[];

  function isVencido(f: Fijo): boolean {
    if (!f.vencimiento) return false;
    const [vAnio, vMes] = f.vencimiento.split('T')[0].split('-').map(Number);
    return vAnio < anio || (vAnio === anio && vMes < mes);
  }

  function cobroFecha(cobro: string | null): string | null {
    if (!cobro) return null;
    const day = Math.min(parseInt(cobro), new Date(anio, mes, 0).getDate());
    return `${anio}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const insertGasto = db.prepare('INSERT INTO gastos (mes_id, gasto, fecha, categoria, banco, importe, comentario) VALUES (?,?,?,?,?,?,?)');
  const insertIngreso = db.prepare('INSERT INTO ingresos (mes_id, inquilino, aportacion, comentario) VALUES (?,?,?,?)');

  for (const f of gastosFijos) {
    if (isVencido(f)) continue;
    insertGasto.run(mesId, f.gasto, cobroFecha(f.cobro), f.categoria, f.banco, f.importe, f.comentario);
  }
  for (const f of ingresosFijos) {
    if (isVencido(f)) continue;
    insertIngreso.run(mesId, f.gasto, f.importe, f.comentario);
  }

  const objetivosMensual = getAhorroObjetivos().reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  if (objetivosMensual > 0) {
    insertGasto.run(mesId, 'Objetivos de ahorro', null, null, null, objetivosMensual, 'Aportación mensual necesaria para los objetivos de ahorro en progreso');
  }
}

export interface MesBalance {
  id: number;
  nombre: string;
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  totalPrestamos: number;
  balance: number;
}

export function getBalanceHistory(limit = 6): MesBalance[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      m.id, m.nombre, m.mes, m.anio,
      COALESCE((SELECT SUM(aportacion) FROM ingresos WHERE mes_id = m.id), 0) AS totalIngresos,
      COALESCE((SELECT SUM(importe)    FROM gastos    WHERE mes_id = m.id), 0) AS totalGastos,
      COALESCE((SELECT SUM(importe)    FROM prestamos WHERE mes_id = m.id), 0) AS totalPrestamos
    FROM meses m
    ORDER BY m.anio DESC, m.mes DESC
    LIMIT ?
  `).all(limit) as Array<{ id: number; nombre: string; mes: number; anio: number; totalIngresos: number; totalGastos: number; totalPrestamos: number }>;
  return rows.map(r => ({ ...r, balance: r.totalIngresos - r.totalGastos - r.totalPrestamos })).reverse();
}

export interface GastoCatTotal {
  categoria: string;
  total: number;
  color: string;
}

export function getGastosPorCategoria(mesId: number): GastoCatTotal[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT COALESCE(categoria, 'Sin categoría') AS categoria, SUM(importe) AS total
    FROM gastos WHERE mes_id = ?
    GROUP BY categoria ORDER BY total DESC
  `).all(mesId) as Array<{ categoria: string; total: number }>;
  const cats = db.prepare("SELECT nombre, color FROM categorias WHERE tipo='gasto'").all() as Array<{ nombre: string; color: string }>;
  const colorMap = Object.fromEntries(cats.map(c => [c.nombre, c.color]));
  const PALETTE = ['#6366f1','#0ea5e9','#10b981','#f97316','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];
  return rows.map((r, i) => ({ ...r, color: colorMap[r.categoria] ?? PALETTE[i % PALETTE.length] }));
}

export interface CategoriaStats {
  categoria: string;
  color: string;
  totalesPorMes: number[];
  total: number;
  promedio: number;
}

export interface EstadisticasData {
  mesesLabels: string[];
  categorias: CategoriaStats[];
}

export function getEstadisticasGastos(limit = 12): EstadisticasData {
  const db = getDb();
  const meses = (db.prepare(
    'SELECT id, nombre FROM meses ORDER BY anio DESC, mes DESC LIMIT ?'
  ).all(limit) as Array<{ id: number; nombre: string }>).reverse();

  if (meses.length === 0) return { mesesLabels: [], categorias: [] };

  const placeholders = meses.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT mes_id, COALESCE(categoria, 'Sin categoría') AS categoria, SUM(importe) AS total
    FROM gastos WHERE mes_id IN (${placeholders})
    GROUP BY mes_id, categoria
  `).all(...meses.map(m => m.id)) as Array<{ mes_id: number; categoria: string; total: number }>;

  const cats = db.prepare("SELECT nombre, color FROM categorias WHERE tipo='gasto'").all() as Array<{ nombre: string; color: string }>;
  const colorMap = Object.fromEntries(cats.map(c => [c.nombre, c.color]));
  const PALETTE = ['#6366f1','#0ea5e9','#10b981','#f97316','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];

  const allCatNames = cats.map(c => c.nombre);
  const catNamesFromGastos = [...new Set(rows.map(r => r.categoria))];
  const catNames = [...new Set([...allCatNames, ...catNamesFromGastos])];
  const categorias: CategoriaStats[] = catNames.map((cat, i) => {
    const totalesPorMes = meses.map(m => rows.find(r => r.mes_id === m.id && r.categoria === cat)?.total ?? 0);
    const total = totalesPorMes.reduce((s, v) => s + v, 0);
    return {
      categoria: cat,
      color: colorMap[cat] ?? PALETTE[i % PALETTE.length],
      totalesPorMes,
      total,
      promedio: meses.length > 0 ? total / meses.length : 0,
    };
  }).sort((a, b) => b.total - a.total);

  return { mesesLabels: meses.map(m => m.nombre), categorias };
}

export function getPersonalEstadisticas(userId: number, limit = 12): EstadisticasData {
  const db = getDb();
  const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const allMeses = db.prepare(
    'SELECT anio, mes FROM personal_meses WHERE user_id = ? ORDER BY anio DESC, mes DESC'
  ).all(userId) as Array<{ anio: number; mes: number }>;
  const meses = allMeses.slice(0, limit).reverse();

  if (meses.length === 0) return { mesesLabels: [], categorias: [] };

  const keys = meses.map(m => m.anio * 100 + m.mes);
  const placeholders = keys.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT anio, mes, COALESCE(categoria, 'Sin categoría') AS categoria, SUM(importe) AS total
    FROM personal_gastos_mes
    WHERE user_id = ? AND (anio * 100 + mes) IN (${placeholders})
    GROUP BY anio, mes, categoria
  `).all(userId, ...keys) as Array<{ anio: number; mes: number; categoria: string; total: number }>;

  const cats = db.prepare('SELECT nombre, color FROM personal_categorias WHERE user_id = ? ORDER BY nombre').all(userId) as Array<{ nombre: string; color: string }>;
  const colorMap = Object.fromEntries(cats.map(c => [c.nombre, c.color]));
  const PALETTE = ['#f97316','#10b981','#8b5cf6','#0ea5e9','#f59e0b','#ec4899','#6366f1','#06b6d4'];

  const allCatNames = cats.map(c => c.nombre);
  const catNamesFromGastos = [...new Set(rows.map(r => r.categoria))];
  const catNames = [...new Set([...allCatNames, ...catNamesFromGastos])];

  const categorias: CategoriaStats[] = catNames.map((cat, i) => {
    const totalesPorMes = meses.map(m => rows.find(r => r.anio === m.anio && r.mes === m.mes && r.categoria === cat)?.total ?? 0);
    const total = totalesPorMes.reduce((s, v) => s + v, 0);
    return {
      categoria: cat,
      color: colorMap[cat] ?? PALETTE[i % PALETTE.length],
      totalesPorMes,
      total,
      promedio: meses.length > 0 ? total / meses.length : 0,
    };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return { mesesLabels: meses.map(m => `${MESES_NOMBRES[m.mes - 1]} ${m.anio}`), categorias };
}

export function getRegistroLuz(): RegistroLuz[] {
  const db = getDb();
  return db.prepare('SELECT * FROM registro_luz ORDER BY anio DESC, fecha_lectura_inicio ASC NULLS LAST, id ASC').all() as RegistroLuz[];
}

export function getRegistroAgua(): RegistroAgua[] {
  const db = getDb();
  return db.prepare('SELECT * FROM registro_agua ORDER BY anio DESC, fecha_lectura_inicio ASC NULLS LAST, id ASC').all() as RegistroAgua[];
}

// ── Users ──────────────────────────────────────────────────────────────────

export interface DbUser {
  id: number;
  nombre: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'visor';
  avatar_url: string | null;
  must_change_password: number;
  tutorial_seen: number;
  version_seen: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  nombre: string;
  username: string;
  role: 'admin' | 'editor' | 'visor';
  avatar_url: string | null;
  created_at: string;
}

export function getUserByUsername(username: string): DbUser | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser) ?? null;
}

export function getUserById(id: number): DbUser | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser) ?? null;
}

export function getAllUsers(): PublicUser[] {
  const db = getDb();
  return db.prepare('SELECT id, nombre, username, role, avatar_url, created_at FROM users ORDER BY created_at ASC').all() as PublicUser[];
}

export function createUser(nombre: string, username: string, passwordHash: string, role: 'admin' | 'editor' | 'visor'): void {
  const db = getDb();
  db.prepare('INSERT INTO users (nombre, username, password_hash, role) VALUES (?, ?, ?, ?)').run(nombre, username, passwordHash, role);
}

export function deleteUser(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function countAdminUsers(): number {
  const db = getDb();
  return ((db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'admin'").get() as { n: number }).n);
}

export function updateUserPassword(id: number, passwordHash: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(passwordHash, id);
}

export function resetUserPassword(id: number, passwordHash: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(passwordHash, id);
}

export function updateUserRole(id: number, role: 'admin' | 'editor' | 'visor'): void {
  const db = getDb();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
}

export function clearMustChangePassword(id: number): void {
  const db = getDb();
  db.prepare('UPDATE users SET must_change_password = 0 WHERE id = ?').run(id);
}

export function markTutorialSeen(id: number): void {
  const db = getDb();
  db.prepare('UPDATE users SET tutorial_seen = 1 WHERE id = ?').run(id);
}

export function markVersionSeen(id: number, version: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET version_seen = ? WHERE id = ?').run(version, id);
}

export function updateUserAvatar(id: number, avatarUrl: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, id);
}

export function clearUserAvatar(id: number): void {
  const db = getDb();
  db.prepare('UPDATE users SET avatar_url = NULL WHERE id = ?').run(id);
}

export function isHogarActivated(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'hogar_activated'").get() as { value: string } | undefined;
  return row?.value === '1';
}

export function activateHogar(): void {
  const db = getDb();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('hogar_activated', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
}

export function updateUserProfile(id: number, nombre: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET nombre = ? WHERE id = ?').run(nombre, id);
}

// ── Personal: Categorías ───────────────────────────────────────────────────

export interface PersonalCategoria { id: number; user_id: number; nombre: string; color: string; }

export function getPersonalCategorias(userId: number): PersonalCategoria[] {
  return getDb().prepare('SELECT * FROM personal_categorias WHERE user_id = ? ORDER BY nombre').all(userId) as PersonalCategoria[];
}
export function createPersonalCategoria(userId: number, nombre: string, color: string): number {
  const result = getDb().prepare('INSERT INTO personal_categorias (user_id, nombre, color) VALUES (?, ?, ?)').run(userId, nombre, color);
  return Number(result.lastInsertRowid);
}
export function updatePersonalCategoria(id: number, userId: number, nombre: string, color: string): void {
  getDb().prepare('UPDATE personal_categorias SET nombre = ?, color = ? WHERE id = ? AND user_id = ?').run(nombre, color, id, userId);
}
export function deletePersonalCategoria(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_categorias WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Bancos ───────────────────────────────────────────────────────

export interface PersonalBanco { id: number; user_id: number; nombre: string; color: string; }

export function getPersonalBancos(userId: number): PersonalBanco[] {
  return getDb().prepare('SELECT * FROM personal_bancos WHERE user_id = ? ORDER BY nombre').all(userId) as PersonalBanco[];
}
export function createPersonalBanco(userId: number, nombre: string, color: string): void {
  getDb().prepare('INSERT INTO personal_bancos (user_id, nombre, color) VALUES (?, ?, ?)').run(userId, nombre, color);
}
export function updatePersonalBanco(id: number, userId: number, nombre: string, color: string): void {
  getDb().prepare('UPDATE personal_bancos SET nombre = ?, color = ? WHERE id = ? AND user_id = ?').run(nombre, color, id, userId);
}
export function deletePersonalBanco(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_bancos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Gastos Fijos ─────────────────────────────────────────────────

export interface PersonalGastoFijo {
  id: number; user_id: number; gasto: string; importe: number;
  categoria: string | null; banco: string | null;
  cobro: string | null; vencimiento: string | null; comentario: string | null;
  created_at: string;
}

export function getPersonalGastos(userId: number): PersonalGastoFijo[] {
  const db = getDb();
  db.prepare("DELETE FROM personal_gastos_fijos WHERE user_id = ? AND vencimiento IS NOT NULL AND substr(vencimiento, 1, 10) < ?").run(userId, todayIso());
  return db.prepare('SELECT * FROM personal_gastos_fijos WHERE user_id = ? ORDER BY gasto').all(userId) as PersonalGastoFijo[];
}
export function createPersonalGasto(userId: number, data: Omit<PersonalGastoFijo, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'INSERT INTO personal_gastos_fijos (user_id, gasto, importe, categoria, banco, cobro, vencimiento, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, data.gasto, data.importe, data.categoria, data.banco, data.cobro, data.vencimiento, data.comentario);
}
export function updatePersonalGasto(id: number, userId: number, data: Omit<PersonalGastoFijo, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'UPDATE personal_gastos_fijos SET gasto = ?, importe = ?, categoria = ?, banco = ?, cobro = ?, vencimiento = ?, comentario = ? WHERE id = ? AND user_id = ?'
  ).run(data.gasto, data.importe, data.categoria, data.banco, data.cobro, data.vencimiento, data.comentario, id, userId);
}
export function deletePersonalGasto(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_gastos_fijos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Ingresos Fijos ──────────────────────────────────────────────

export interface PersonalIngresoFijo {
  id: number; user_id: number; concepto: string; importe: number;
  comentario: string | null; created_at: string;
}

export function getPersonalIngresosFijos(userId: number): PersonalIngresoFijo[] {
  return getDb().prepare('SELECT * FROM personal_ingresos_fijos WHERE user_id = ? ORDER BY concepto').all(userId) as PersonalIngresoFijo[];
}
export function createPersonalIngresoFijo(userId: number, data: Omit<PersonalIngresoFijo, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'INSERT INTO personal_ingresos_fijos (user_id, concepto, importe, comentario) VALUES (?, ?, ?, ?)'
  ).run(userId, data.concepto, data.importe, data.comentario);
}
export function updatePersonalIngresoFijo(id: number, userId: number, data: Omit<PersonalIngresoFijo, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'UPDATE personal_ingresos_fijos SET concepto = ?, importe = ?, comentario = ? WHERE id = ? AND user_id = ?'
  ).run(data.concepto, data.importe, data.comentario, id, userId);
}
export function deletePersonalIngresoFijo(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_ingresos_fijos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Suscripciones ────────────────────────────────────────────────

export interface PersonalSuscripcion {
  id: number; user_id: number; nombre: string; importe: number;
  cobro: string | null; periodicidad: 'mensual' | 'trimestral' | 'anual'; comentario: string | null;
  created_at: string;
}

export function getPersonalSuscripciones(userId: number): PersonalSuscripcion[] {
  return getDb().prepare('SELECT * FROM personal_suscripciones WHERE user_id = ? ORDER BY nombre').all(userId) as PersonalSuscripcion[];
}
export function createPersonalSuscripcion(userId: number, data: Omit<PersonalSuscripcion, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'INSERT INTO personal_suscripciones (user_id, nombre, importe, cobro, periodicidad, comentario) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario);
}
export function updatePersonalSuscripcion(id: number, userId: number, data: Omit<PersonalSuscripcion, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'UPDATE personal_suscripciones SET nombre = ?, importe = ?, cobro = ?, periodicidad = ?, comentario = ? WHERE id = ? AND user_id = ?'
  ).run(data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario, id, userId);
}
export function deletePersonalSuscripcion(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_suscripciones WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Ahorro ───────────────────────────────────────────────────────

export interface PersonalAhorro {
  id: number; user_id: number; anio: number; objetivo_anual: number;
  meses: PersonalAhorroMes[];
}
export interface PersonalAhorroMes { id: number; ahorro_id: number; mes: number; aportado: number; }

export function getPersonalAhorro(userId: number, anio: number): PersonalAhorro {
  const db = getDb();
  let row = db.prepare('SELECT * FROM personal_ahorro WHERE user_id = ? AND anio = ?').get(userId, anio) as { id: number; user_id: number; anio: number; objetivo_anual: number } | null;
  if (!row) {
    db.prepare('INSERT INTO personal_ahorro (user_id, anio, objetivo_anual) VALUES (?, ?, 0)').run(userId, anio);
    row = db.prepare('SELECT * FROM personal_ahorro WHERE user_id = ? AND anio = ?').get(userId, anio) as { id: number; user_id: number; anio: number; objetivo_anual: number };
  }
  // Ensure all 12 months exist
  for (let m = 1; m <= 12; m++) {
    db.prepare('INSERT OR IGNORE INTO personal_ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, 0)').run(row.id, m);
  }
  const meses = db.prepare('SELECT * FROM personal_ahorro_mes WHERE ahorro_id = ? ORDER BY mes').all(row.id) as PersonalAhorroMes[];
  return { ...row, meses };
}

export function updatePersonalAhorroObjetivo(userId: number, anio: number, objetivoAnual: number): PersonalAhorro {
  const db = getDb();
  db.prepare('INSERT INTO personal_ahorro (user_id, anio, objetivo_anual) VALUES (?, ?, ?) ON CONFLICT(user_id, anio) DO UPDATE SET objetivo_anual = excluded.objetivo_anual').run(userId, anio, objetivoAnual);
  return getPersonalAhorro(userId, anio);
}

export function updatePersonalAhorroMes(userId: number, anio: number, mes: number, aportado: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM personal_ahorro WHERE user_id = ? AND anio = ?').get(userId, anio) as { id: number } | null;
  if (!row) return;
  db.prepare('INSERT INTO personal_ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, ?) ON CONFLICT(ahorro_id, mes) DO UPDATE SET aportado = excluded.aportado').run(row.id, mes, aportado);
}

// ── Personal: Objetivos de ahorro ──────────────────────────────────────────

export interface PersonalAhorroObjetivo {
  id: number; user_id: number; nombre: string; objetivo: number;
  fecha_objetivo: string; aportado: number; created_at: string;
}

export function getPersonalAhorroObjetivos(userId: number): PersonalAhorroObjetivo[] {
  return getDb().prepare('SELECT * FROM personal_ahorro_objetivos WHERE user_id = ? ORDER BY fecha_objetivo').all(userId) as PersonalAhorroObjetivo[];
}
export function createPersonalAhorroObjetivo(userId: number, data: { nombre: string; objetivo: number; fecha_objetivo: string }): void {
  getDb().prepare(
    'INSERT INTO personal_ahorro_objetivos (user_id, nombre, objetivo, fecha_objetivo) VALUES (?, ?, ?, ?)'
  ).run(userId, data.nombre, data.objetivo, data.fecha_objetivo);
}
export function updatePersonalAhorroObjetivoDatos(id: number, userId: number, data: { nombre: string; objetivo: number; fecha_objetivo: string }): void {
  getDb().prepare(
    'UPDATE personal_ahorro_objetivos SET nombre = ?, objetivo = ?, fecha_objetivo = ? WHERE id = ? AND user_id = ?'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo, id, userId);
}
export function updatePersonalAhorroObjetivoAportado(id: number, userId: number, aportado: number): void {
  getDb().prepare('UPDATE personal_ahorro_objetivos SET aportado = ? WHERE id = ? AND user_id = ?').run(aportado, id, userId);
}
export function deletePersonalAhorroObjetivo(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_ahorro_objetivos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Hogar: Objetivos de ahorro ─────────────────────────────────────────────

export interface AhorroObjetivo {
  id: number; nombre: string; objetivo: number;
  fecha_objetivo: string; aportado: number; created_at: string;
}

export function getAhorroObjetivos(): AhorroObjetivo[] {
  return getDb().prepare('SELECT * FROM ahorro_objetivos ORDER BY fecha_objetivo').all() as AhorroObjetivo[];
}
export function createAhorroObjetivo(data: { nombre: string; objetivo: number; fecha_objetivo: string }): void {
  getDb().prepare(
    'INSERT INTO ahorro_objetivos (nombre, objetivo, fecha_objetivo) VALUES (?, ?, ?)'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo);
}
export function updateAhorroObjetivoDatos(id: number, data: { nombre: string; objetivo: number; fecha_objetivo: string }): void {
  getDb().prepare(
    'UPDATE ahorro_objetivos SET nombre = ?, objetivo = ?, fecha_objetivo = ? WHERE id = ?'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo, id);
}
export function updateAhorroObjetivoAportado(id: number, aportado: number): void {
  getDb().prepare('UPDATE ahorro_objetivos SET aportado = ? WHERE id = ?').run(aportado, id);
}
export function deleteAhorroObjetivo(id: number): void {
  getDb().prepare('DELETE FROM ahorro_objetivos WHERE id = ?').run(id);
}

// ── Personal: Gastos de mes ────────────────────────────────────────────────

export interface PersonalGastoMes {
  id: number;
  user_id: number;
  anio: number;
  mes: number;
  concepto: string;
  importe: number;
  categoria: string | null;
  banco: string | null;
  fecha: string | null;
  comentario: string | null;
  created_at: string;
}

export function getPersonalGastosMes(userId: number, anio: number, mes: number): PersonalGastoMes[] {
  return getDb().prepare(
    'SELECT * FROM personal_gastos_mes WHERE user_id = ? AND anio = ? AND mes = ? ORDER BY fecha ASC NULLS LAST, id ASC'
  ).all(userId, anio, mes) as PersonalGastoMes[];
}

export function createPersonalGastoMes(
  userId: number, anio: number, mes: number,
  data: Pick<PersonalGastoMes, 'concepto' | 'importe' | 'categoria' | 'banco' | 'fecha' | 'comentario'>
): void {
  getDb().prepare(
    'INSERT INTO personal_gastos_mes (user_id, anio, mes, concepto, importe, categoria, banco, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, anio, mes, data.concepto, data.importe, data.categoria, data.banco, data.fecha, data.comentario);
}

export function updatePersonalGastoMes(
  id: number, userId: number,
  data: Pick<PersonalGastoMes, 'concepto' | 'importe' | 'categoria' | 'banco' | 'fecha' | 'comentario'>
): void {
  getDb().prepare(
    'UPDATE personal_gastos_mes SET concepto = ?, importe = ?, categoria = ?, banco = ?, fecha = ?, comentario = ? WHERE id = ? AND user_id = ?'
  ).run(data.concepto, data.importe, data.categoria, data.banco, data.fecha, data.comentario, id, userId);
}

export function deletePersonalGastoMes(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_gastos_mes WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Meses creados ────────────────────────────────────────────────

export interface PersonalMes { id: number; user_id: number; mes: number; anio: number; }

export function getPersonalMeses(userId: number): PersonalMes[] {
  return getDb().prepare(
    'SELECT * FROM personal_meses WHERE user_id = ? ORDER BY anio DESC, mes DESC'
  ).all(userId) as PersonalMes[];
}

export function personalMesExists(userId: number, mes: number, anio: number): boolean {
  return !!getDb().prepare('SELECT 1 FROM personal_meses WHERE user_id = ? AND mes = ? AND anio = ?').get(userId, mes, anio);
}

export function createPersonalMes(userId: number, mes: number, anio: number): void {
  getDb().prepare('INSERT OR IGNORE INTO personal_meses (user_id, mes, anio) VALUES (?, ?, ?)').run(userId, mes, anio);
}

export function clearPersonalMesGastos(userId: number, mes: number, anio: number): void {
  getDb().prepare('DELETE FROM personal_gastos_mes WHERE user_id = ? AND mes = ? AND anio = ?').run(userId, mes, anio);
}

export function clearPersonalMesIngresos(userId: number, mes: number, anio: number): void {
  getDb().prepare('DELETE FROM personal_ingresos_mes WHERE user_id = ? AND mes = ? AND anio = ?').run(userId, mes, anio);
}

// ── Personal: Ingresos de mes ──────────────────────────────────────────────

export interface PersonalIngresoMes {
  id: number;
  user_id: number;
  anio: number;
  mes: number;
  concepto: string;
  importe: number;
  fecha: string | null;
  comentario: string | null;
  created_at: string;
}

export function getPersonalIngresosMes(userId: number, anio: number, mes: number): PersonalIngresoMes[] {
  return getDb().prepare(
    'SELECT * FROM personal_ingresos_mes WHERE user_id = ? AND anio = ? AND mes = ? ORDER BY fecha ASC NULLS LAST, id ASC'
  ).all(userId, anio, mes) as PersonalIngresoMes[];
}

export function createPersonalIngresoMes(
  userId: number, anio: number, mes: number,
  data: Pick<PersonalIngresoMes, 'concepto' | 'importe' | 'fecha' | 'comentario'>
): void {
  getDb().prepare(
    'INSERT INTO personal_ingresos_mes (user_id, anio, mes, concepto, importe, fecha, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, anio, mes, data.concepto, data.importe, data.fecha, data.comentario);
}

export function updatePersonalIngresoMes(
  id: number, userId: number,
  data: Pick<PersonalIngresoMes, 'concepto' | 'importe' | 'fecha' | 'comentario'>
): void {
  getDb().prepare(
    'UPDATE personal_ingresos_mes SET concepto = ?, importe = ?, fecha = ?, comentario = ? WHERE id = ? AND user_id = ?'
  ).run(data.concepto, data.importe, data.fecha, data.comentario, id, userId);
}

export function deletePersonalIngresoMes(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_ingresos_mes WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Personal: Evolución histórica ─────────────────────────────────────────

const NOMBRES_MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export interface PersonalMesEvolucion {
  anio: number;
  mes: number;
  nombre: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

export function getPersonalEvolucion(userId: number, limit = 6): PersonalMesEvolucion[] {
  const db = getDb();
  const ingresos = db.prepare('SELECT anio, mes, SUM(importe) AS total FROM personal_ingresos_mes WHERE user_id = ? GROUP BY anio, mes').all(userId) as { anio: number; mes: number; total: number }[];
  const gastos   = db.prepare('SELECT anio, mes, SUM(importe) AS total FROM personal_gastos_mes   WHERE user_id = ? GROUP BY anio, mes').all(userId) as { anio: number; mes: number; total: number }[];

  const ingMap = Object.fromEntries(ingresos.map(r => [`${r.anio}-${r.mes}`, r.total]));
  const gasMap = Object.fromEntries(gastos.map(r =>   [`${r.anio}-${r.mes}`, r.total]));

  // Generate last `limit` months ending at current month
  const result: PersonalMesEvolucion[] = [];
  const now = new Date();
  let anio = now.getFullYear();
  let mes  = now.getMonth() + 1;

  for (let i = 0; i < limit; i++) {
    const key = `${anio}-${mes}`;
    const totalIngresos = ingMap[key] ?? 0;
    const totalGastos   = gasMap[key] ?? 0;
    result.unshift({
      anio, mes,
      nombre: `${NOMBRES_MESES_ES[mes - 1].slice(0, 3)} ${anio}`,
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
    });
    mes--;
    if (mes === 0) { mes = 12; anio--; }
  }

  return result;
}

// ── Personal: Presupuesto auto-config ─────────────────────────────────────

export interface PresupuestoAutoConfig {
  tipo: 'suscripciones' | 'ahorro' | 'objetivos';
  banco: string | null;
  categoria: string | null;
  redondeo: number;
}

export function getPresupuestoAutoConfigs(userId: number): PresupuestoAutoConfig[] {
  return getDb().prepare(
    'SELECT tipo, banco, categoria, redondeo FROM personal_presupuesto_auto WHERE user_id = ?'
  ).all(userId) as PresupuestoAutoConfig[];
}

export function upsertPresupuestoAuto(userId: number, tipo: string, banco: string | null, categoria: string | null, redondeo?: boolean): void {
  getDb().prepare(
    `INSERT INTO personal_presupuesto_auto (user_id, tipo, banco, categoria, redondeo) VALUES (?, ?, ?, ?, COALESCE(?, 1))
     ON CONFLICT(user_id, tipo) DO UPDATE SET banco = excluded.banco, categoria = excluded.categoria,
       redondeo = CASE WHEN ? IS NULL THEN redondeo ELSE excluded.redondeo END`
  ).run(userId, tipo, banco, categoria, redondeo === undefined ? null : (redondeo ? 1 : 0), redondeo === undefined ? null : (redondeo ? 1 : 0));
}

// ── Hogar: Presupuesto auto-config ─────────────────────────────────────────

export function getPresupuestoAutoConfigsHogar(): PresupuestoAutoConfig[] {
  return getDb().prepare('SELECT tipo, banco, categoria FROM presupuesto_auto').all() as PresupuestoAutoConfig[];
}

export function upsertPresupuestoAutoHogar(tipo: string, banco: string | null, categoria: string | null): void {
  getDb().prepare(
    'INSERT INTO presupuesto_auto (tipo, banco, categoria) VALUES (?, ?, ?) ON CONFLICT(tipo) DO UPDATE SET banco = excluded.banco, categoria = excluded.categoria'
  ).run(tipo, banco, categoria);
}
