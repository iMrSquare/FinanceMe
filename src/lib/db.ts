import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { mensualNecesario } from './ahorroObjetivos';
import { objetivoMensualAhorro } from './ahorro';
import { lineasRecurrentesMes } from './recurrentes';
import { sugerirIcono } from './categoryIcons';
import type { SessionUser } from './auth-edge';

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

    CREATE TABLE IF NOT EXISTS ahorro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anio INTEGER NOT NULL,
      objetivo_anual REAL NOT NULL DEFAULT 0,
      UNIQUE(anio)
    );

    CREATE TABLE IF NOT EXISTS ahorro_mes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ahorro_id INTEGER NOT NULL REFERENCES ahorro(id) ON DELETE CASCADE,
      mes INTEGER NOT NULL,
      aportado REAL NOT NULL DEFAULT 0,
      UNIQUE(ahorro_id, mes)
    );

    CREATE TABLE IF NOT EXISTS presupuesto_auto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL UNIQUE,
      banco TEXT,
      categoria TEXT
    );

    CREATE TABLE IF NOT EXISTS hogar_recurrentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      importe REAL NOT NULL DEFAULT 0,
      cobro TEXT,
      periodicidad TEXT NOT NULL DEFAULT 'mensual',
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      notify_hogar INTEGER NOT NULL DEFAULT 0,
      notify_personal INTEGER NOT NULL DEFAULT 0,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_enviados (
      clave TEXT PRIMARY KEY,
      enviado_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Migration: recurrentes volcados al mes como una línea total (0) o desglosados (1)
  for (const sql of [
    'ALTER TABLE personal_presupuesto_auto ADD COLUMN desglose INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE presupuesto_auto ADD COLUMN redondeo INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE presupuesto_auto ADD COLUMN desglose INTEGER NOT NULL DEFAULT 0',
  ]) {
    try { db.exec(sql); } catch {}
  }

  // Migration: add version_seen column to existing databases.
  // Backfilled to an old version so existing users see the "new version"
  // badge once when this feature itself is deployed.
  try {
    db.exec("ALTER TABLE users ADD COLUMN version_seen TEXT NOT NULL DEFAULT 'v1.0.0'");
  } catch {}

  // Migration: add appearance columns (theme system) to existing databases
  for (const sql of [
    "ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'indigo'",
    "ALTER TABLE users ADD COLUMN color_mode TEXT NOT NULL DEFAULT 'system'",
    'ALTER TABLE users ADD COLUMN accent_personal TEXT',
    'ALTER TABLE users ADD COLUMN accent_hogar TEXT',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // v1.2.0: icono por categoría; a las existentes se les sugiere uno según su nombre
  for (const sql of ['ALTER TABLE categorias ADD COLUMN icono TEXT', 'ALTER TABLE personal_categorias ADD COLUMN icono TEXT']) {
    try { db.exec(sql); } catch { /* ya existe */ }
  }
  for (const tabla of ['categorias', 'personal_categorias'] as const) {
    const sinIcono = db.prepare(`SELECT id, nombre FROM ${tabla} WHERE icono IS NULL`).all() as { id: number; nombre: string }[];
    const set = db.prepare(`UPDATE ${tabla} SET icono = ? WHERE id = ?`);
    for (const c of sinIcono) set.run(sugerirIcono(c.nombre), c.id);
  }

  // v1.2.0: el tema Institucional pasa a ser el predeterminado. Una sola vez, los usuarios
  // que seguían con el tema de serie (Clásico) pasan a Institucional; los demás conservan el suyo.
  const temaMigrado = db.prepare("SELECT value FROM app_settings WHERE key = 'tema_institucional'").get();
  if (!temaMigrado) {
    db.prepare("UPDATE users SET theme = 'institucional' WHERE theme = 'indigo'").run();
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('tema_institucional', '1')").run();
  }
  // v1.2.0: se retiran los temas Clásico, Monokai y Dracula; quien los usara pasa a Institucional
  db.prepare("UPDATE users SET theme = 'institucional' WHERE theme IN ('indigo', 'monokai', 'dracula')").run();

  // v1.2.0: el tutorial se renovó; una sola vez se vuelve a mostrar a todos los usuarios.
  // Al cerrarlo se marca como visto y ya solo se abre desde Mi perfil › Tutorial.
  if (!db.prepare("SELECT value FROM app_settings WHERE key = 'tutorial_v1_2_0'").get()) {
    db.prepare('UPDATE users SET tutorial_seen = 0').run();
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('tutorial_v1_2_0', '1')").run();
  }

  // v1.2.0: cada recurrente lleva su categoría y banco (se usan al añadirlos desglosados)
  for (const t of ['personal_suscripciones', 'hogar_recurrentes']) {
    for (const col of ['categoria', 'banco']) {
      try { db.exec(`ALTER TABLE ${t} ADD COLUMN ${col} TEXT`); } catch { /* ya existe */ }
    }
  }

  // v1.2.0: modo (Personal u Hogar) con el que se abre la aplicación al iniciar sesión
  try { db.exec("ALTER TABLE users ADD COLUMN modo_inicio TEXT NOT NULL DEFAULT 'personal'"); } catch { /* ya existe */ }

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

  // Migration: add candado de bloqueo a meses (Hogar) y personal_meses
  for (const sql of [
    'ALTER TABLE meses ADD COLUMN bloqueado INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE personal_meses ADD COLUMN bloqueado INTEGER NOT NULL DEFAULT 0',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // Migration: add emoji a los objetivos de ahorro (Hogar y Personal)
  for (const sql of [
    'ALTER TABLE personal_ahorro_objetivos ADD COLUMN emoji TEXT',
    'ALTER TABLE ahorro_objetivos ADD COLUMN emoji TEXT',
  ]) { try { db.exec(sql); } catch { /* already exists */ } }

  // Seed default admin user if no users exist
  const userCount = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
  if (userCount === 0) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
    db.prepare(
      "INSERT INTO users (nombre, username, password_hash, role, must_change_password, theme) VALUES (?, ?, ?, ?, ?, 'institucional')"
    ).run('Administrador', 'admin', `${salt}:${hash}`, 'admin', 1);
  }
}

// Types
export interface Mes {
  id: number;
  nombre: string;
  mes: number;
  anio: number;
  bloqueado: number;
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
  icono?: string | null;
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

export function getMesActual(): { mes: number; anio: number } {
  const now = new Date();
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}

export function esMesVencido(mes: number, anio: number): boolean {
  const { mes: mesActual, anio: anioActual } = getMesActual();
  return anio < anioActual || (anio === anioActual && mes < mesActual);
}

function autoLockMes(db: Database.Database, m: Mes): Mes {
  if (!m.bloqueado && esMesVencido(m.mes, m.anio)) {
    db.prepare('UPDATE meses SET bloqueado = 1 WHERE id = ?').run(m.id);
    return { ...m, bloqueado: 1 };
  }
  return m;
}

export function getMeses(): Mes[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM meses ORDER BY anio DESC, mes DESC').all() as Mes[];
  return rows.map(m => autoLockMes(db, m));
}

export function getMes(mes: number, anio: number): Mes | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM meses WHERE mes = ? AND anio = ?').get(mes, anio) as Mes | undefined;
  return row ? autoLockMes(db, row) : undefined;
}

export function getOrCreateMes(mes: number, anio: number): Mes {
  const db = getDb();
  const existing = getMes(mes, anio);
  if (existing) return existing;
  const nombre = getNombreMes(mes, anio);
  db.prepare('INSERT INTO meses (nombre, mes, anio) VALUES (?, ?, ?)').run(nombre, mes, anio);
  return getMes(mes, anio)!;
}

export function setMesBloqueado(mesId: number, bloqueado: boolean): void {
  getDb().prepare('UPDATE meses SET bloqueado = ? WHERE id = ?').run(bloqueado ? 1 : 0, mesId);
}

export function isMesBloqueado(mesId: number): boolean {
  const row = getDb().prepare('SELECT bloqueado FROM meses WHERE id = ?').get(mesId) as { bloqueado: number } | undefined;
  return !!row?.bloqueado;
}

export function getMesIdDeGasto(id: number): number | undefined {
  const row = getDb().prepare('SELECT mes_id FROM gastos WHERE id = ?').get(id) as { mes_id: number } | undefined;
  return row?.mes_id;
}

export function getMesIdDeIngreso(id: number): number | undefined {
  const row = getDb().prepare('SELECT mes_id FROM ingresos WHERE id = ?').get(id) as { mes_id: number } | undefined;
  return row?.mes_id;
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

  const autoConfigs = getPresupuestoAutoConfigsHogar();

  const recurrentesCfg = autoConfigs.find(c => c.tipo === 'recurrentes') ?? { banco: null, categoria: null };
  for (const l of lineasRecurrentesMes(getHogarRecurrentes(), recurrentesCfg, anio, mes)) {
    insertGasto.run(mesId, l.concepto, l.fecha, l.categoria, l.banco, l.importe, l.comentario);
  }

  const ahorroAnual = getAhorro(anio);
  const ahorroMensual = objetivoMensualAhorro(ahorroAnual.objetivo_anual, ahorroAnual.meses, anio);
  if (ahorroMensual > 0) {
    const cfg = autoConfigs.find(c => c.tipo === 'ahorro');
    insertGasto.run(mesId, 'Ahorro mensual', null, cfg?.categoria ?? null, cfg?.banco ?? null, ahorroMensual, `Objetivo ${ahorroAnual.objetivo_anual} € / año, cuota recalculada según lo aportado`);
  }

  const objetivosMensual = getAhorroObjetivos().reduce((s, o) => s + (mensualNecesario(o) ?? 0), 0);
  if (objetivosMensual > 0) {
    const cfg = autoConfigs.find(c => c.tipo === 'objetivos');
    insertGasto.run(mesId, 'Objetivos', null, cfg?.categoria ?? null, cfg?.banco ?? null, objetivosMensual, 'Aportación mensual necesaria para los objetivos de ahorro en progreso');
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
  icono?: string | null;
  totalesPorMes: number[];
  total: number;
  promedio: number;
}

export interface EstadisticasData {
  mesesLabels: string[];
  categorias: CategoriaStats[];
  /** YYYY-MM de cada columna de mesesLabels */
  mesesKeys?: string[];
  /** Todos los meses con datos (YYYY-MM, ascendente), para los filtros */
  disponibles?: string[];
  /** Todas las categorías del ámbito, para los filtros */
  categoriasDisponibles?: { nombre: string; color: string; icono?: string | null }[];
}

export interface EstadisticasFiltro {
  /** YYYY-MM */
  desde?: string;
  /** YYYY-MM */
  hasta?: string;
  categorias?: string[];
  /** Últimos N meses cuando no se indica rango */
  limit?: number;
}

const SIN_CATEGORIA = 'Sin categoría';
const MESES_NOMBRES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ymKey = (anio: number, mes: number) => `${anio}-${String(mes).padStart(2, '0')}`;
const ymNum = (ym: string) => { const [y, m] = ym.split('-').map(Number); return y * 100 + m; };

function filtrarMeses<T extends { anio: number; mes: number }>(mesesAsc: T[], f: EstadisticasFiltro): T[] {
  const d = f.desde ? ymNum(f.desde) : null;
  const h = f.hasta ? ymNum(f.hasta) : null;
  if (d !== null || h !== null) {
    return mesesAsc.filter(m => { const k = m.anio * 100 + m.mes; return (d === null || k >= d) && (h === null || k <= h); });
  }
  return f.limit ? mesesAsc.slice(-f.limit) : mesesAsc;
}

function construirEstadisticas<T extends { anio: number; mes: number }>(
  mesesAsc: T[],
  meses: T[],
  label: (m: T) => string,
  rows: Array<{ anio: number; mes: number; categoria: string; total: number }>,
  cats: Array<{ nombre: string; color: string; icono?: string | null }>,
  palette: string[],
  f: EstadisticasFiltro,
): EstadisticasData {
  const colorMap = Object.fromEntries(cats.map(c => [c.nombre, c.color]));
  const iconoMap = Object.fromEntries(cats.map(c => [c.nombre, c.icono ?? null]));
  const catNames = [...new Set([...cats.map(c => c.nombre), ...rows.map(r => r.categoria)])];
  const colorDe = (cat: string, i: number) => colorMap[cat] ?? palette[i % palette.length];
  const seleccion = f.categorias?.length ? new Set(f.categorias) : null;

  const categorias: CategoriaStats[] = catNames
    .map((cat, i) => {
      const totalesPorMes = meses.map(m => rows.find(r => r.anio === m.anio && r.mes === m.mes && r.categoria === cat)?.total ?? 0);
      const total = totalesPorMes.reduce((s, v) => s + v, 0);
      return { categoria: cat, color: colorDe(cat, i), icono: iconoMap[cat] ?? null, totalesPorMes, total, promedio: meses.length > 0 ? total / meses.length : 0 };
    })
    .filter(c => c.total > 0 && (!seleccion || seleccion.has(c.categoria)))
    .sort((a, b) => b.total - a.total);

  const hayMesesSinCategoria = rows.some(r => r.categoria === SIN_CATEGORIA);
  return {
    mesesLabels: meses.map(label),
    mesesKeys: meses.map(m => ymKey(m.anio, m.mes)),
    categorias,
    disponibles: mesesAsc.map(m => ymKey(m.anio, m.mes)),
    categoriasDisponibles: [
      ...cats.map((c, i) => ({ nombre: c.nombre, color: colorDe(c.nombre, i), icono: c.icono ?? null })),
      ...(hayMesesSinCategoria && !colorMap[SIN_CATEGORIA] ? [{ nombre: SIN_CATEGORIA, color: '#94a3b8' }] : []),
    ],
  };
}

export function getEstadisticasGastos(filtro: EstadisticasFiltro | number = 12): EstadisticasData {
  const f: EstadisticasFiltro = typeof filtro === 'number' ? { limit: filtro } : filtro;
  const db = getDb();
  const mesesAsc = db.prepare('SELECT id, nombre, anio, mes FROM meses ORDER BY anio ASC, mes ASC')
    .all() as Array<{ id: number; nombre: string; anio: number; mes: number }>;
  const meses = filtrarMeses(mesesAsc, f);
  const cats = db.prepare("SELECT nombre, color, icono FROM categorias WHERE tipo='gasto' ORDER BY nombre").all() as Array<{ nombre: string; color: string; icono: string | null }>;
  const PALETTE = ['#6366f1','#0ea5e9','#10b981','#f97316','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];

  let rows: Array<{ anio: number; mes: number; categoria: string; total: number }> = [];
  if (meses.length) {
    const byId = new Map(meses.map(m => [m.id, m]));
    const placeholders = meses.map(() => '?').join(',');
    rows = (db.prepare(`
      SELECT mes_id, COALESCE(categoria, '${SIN_CATEGORIA}') AS categoria, SUM(importe) AS total
      FROM gastos WHERE mes_id IN (${placeholders})
      GROUP BY mes_id, categoria
    `).all(...meses.map(m => m.id)) as Array<{ mes_id: number; categoria: string; total: number }>)
      .map(r => ({ anio: byId.get(r.mes_id)!.anio, mes: byId.get(r.mes_id)!.mes, categoria: r.categoria, total: r.total }));
  }
  return construirEstadisticas(mesesAsc, meses, m => m.nombre, rows, cats, PALETTE, f);
}

export function getPersonalEstadisticas(userId: number, filtro: EstadisticasFiltro | number = 12): EstadisticasData {
  const f: EstadisticasFiltro = typeof filtro === 'number' ? { limit: filtro } : filtro;
  const db = getDb();
  const mesesAsc = db.prepare('SELECT anio, mes FROM personal_meses WHERE user_id = ? ORDER BY anio ASC, mes ASC')
    .all(userId) as Array<{ anio: number; mes: number }>;
  const meses = filtrarMeses(mesesAsc, f);
  const cats = db.prepare('SELECT nombre, color, icono FROM personal_categorias WHERE user_id = ? ORDER BY nombre').all(userId) as Array<{ nombre: string; color: string; icono: string | null }>;
  const PALETTE = ['#f97316','#10b981','#8b5cf6','#0ea5e9','#f59e0b','#ec4899','#6366f1','#06b6d4'];

  let rows: Array<{ anio: number; mes: number; categoria: string; total: number }> = [];
  if (meses.length) {
    const keys = meses.map(m => m.anio * 100 + m.mes);
    const placeholders = keys.map(() => '?').join(',');
    rows = db.prepare(`
      SELECT anio, mes, COALESCE(categoria, '${SIN_CATEGORIA}') AS categoria, SUM(importe) AS total
      FROM personal_gastos_mes
      WHERE user_id = ? AND (anio * 100 + mes) IN (${placeholders})
      GROUP BY anio, mes, categoria
    `).all(userId, ...keys) as Array<{ anio: number; mes: number; categoria: string; total: number }>;
  }
  return construirEstadisticas(mesesAsc, meses, m => `${MESES_NOMBRES_ES[m.mes - 1]} ${m.anio}`, rows, cats, PALETTE, f);
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
  theme: string;
  color_mode: 'light' | 'dark' | 'system';
  accent_personal: string | null;
  accent_hogar: string | null;
  modo_inicio: 'personal' | 'hogar';
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
  db.prepare("INSERT INTO users (nombre, username, password_hash, role, theme) VALUES (?, ?, ?, ?, 'institucional')").run(nombre, username, passwordHash, role);
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

export interface AppearanceInput {
  theme: string;
  colorMode: 'light' | 'dark' | 'system';
  accentPersonal: string | null;
  accentHogar: string | null;
}

export function updateUserAppearance(id: number, appearance: AppearanceInput): void {
  const db = getDb();
  db.prepare('UPDATE users SET theme = ?, color_mode = ?, accent_personal = ?, accent_hogar = ? WHERE id = ?')
    .run(appearance.theme, appearance.colorMode, appearance.accentPersonal, appearance.accentHogar, id);
}

export function toSessionUser(u: DbUser): SessionUser {
  return {
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    role: u.role,
    avatarUrl: u.avatar_url,
    mustChangePassword: !!u.must_change_password,
    tutorialSeen: !!u.tutorial_seen,
    theme: u.theme,
    colorMode: u.color_mode,
    accentPersonal: u.accent_personal,
    accentHogar: u.accent_hogar,
    modoInicio: u.modo_inicio === 'hogar' ? 'hogar' : 'personal',
  };
}

export function updateUserModoInicio(id: number, modo: 'personal' | 'hogar'): void {
  getDb().prepare('UPDATE users SET modo_inicio = ? WHERE id = ?').run(modo, id);
}

/** Ruta con la que se abre la aplicación: el modo elegido por el usuario, si tiene acceso a él */
export function rutaInicio(u: Pick<DbUser, 'role' | 'modo_inicio'>): '/personal' | '/hogar' {
  return u.modo_inicio === 'hogar' && (u.role === 'admin' || isHogarActivated()) ? '/hogar' : '/personal';
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

export interface PersonalCategoria { id: number; user_id: number; nombre: string; color: string; icono?: string | null; }

export function getPersonalCategorias(userId: number): PersonalCategoria[] {
  return getDb().prepare('SELECT * FROM personal_categorias WHERE user_id = ? ORDER BY nombre').all(userId) as PersonalCategoria[];
}
export function createPersonalCategoria(userId: number, nombre: string, color: string, icono?: string | null): number {
  const result = getDb().prepare('INSERT INTO personal_categorias (user_id, nombre, color, icono) VALUES (?, ?, ?, ?)').run(userId, nombre, color, icono || sugerirIcono(nombre));
  return Number(result.lastInsertRowid);
}
export function updatePersonalCategoria(id: number, userId: number, nombre: string, color: string, icono?: string | null): void {
  const db = getDb();
  const prev = db.prepare('SELECT nombre FROM personal_categorias WHERE id = ? AND user_id = ?').get(id, userId) as { nombre: string } | undefined;
  db.prepare('UPDATE personal_categorias SET nombre = ?, color = ?, icono = COALESCE(?, icono) WHERE id = ? AND user_id = ?').run(nombre, color, icono || null, id, userId);
  if (prev && prev.nombre !== nombre) {
    db.prepare('UPDATE personal_gastos_fijos SET categoria = ? WHERE categoria = ? AND user_id = ?').run(nombre, prev.nombre, userId);
    db.prepare('UPDATE personal_gastos_mes SET categoria = ? WHERE categoria = ? AND user_id = ?').run(nombre, prev.nombre, userId);
    db.prepare('UPDATE personal_presupuesto_auto SET categoria = ? WHERE categoria = ? AND user_id = ?').run(nombre, prev.nombre, userId);
  }
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
  const db = getDb();
  const prev = db.prepare('SELECT nombre FROM personal_bancos WHERE id = ? AND user_id = ?').get(id, userId) as { nombre: string } | undefined;
  db.prepare('UPDATE personal_bancos SET nombre = ?, color = ? WHERE id = ? AND user_id = ?').run(nombre, color, id, userId);
  if (prev && prev.nombre !== nombre) {
    db.prepare('UPDATE personal_gastos_fijos SET banco = ? WHERE banco = ? AND user_id = ?').run(nombre, prev.nombre, userId);
    db.prepare('UPDATE personal_gastos_mes SET banco = ? WHERE banco = ? AND user_id = ?').run(nombre, prev.nombre, userId);
    db.prepare('UPDATE personal_presupuesto_auto SET banco = ? WHERE banco = ? AND user_id = ?').run(nombre, prev.nombre, userId);
  }
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
  categoria: string | null; banco: string | null;
  created_at: string;
}

export function getPersonalSuscripciones(userId: number): PersonalSuscripcion[] {
  return getDb().prepare('SELECT * FROM personal_suscripciones WHERE user_id = ? ORDER BY nombre').all(userId) as PersonalSuscripcion[];
}
export function createPersonalSuscripcion(userId: number, data: Omit<PersonalSuscripcion, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'INSERT INTO personal_suscripciones (user_id, nombre, importe, cobro, periodicidad, comentario, categoria, banco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario, data.categoria, data.banco);
}
export function updatePersonalSuscripcion(id: number, userId: number, data: Omit<PersonalSuscripcion, 'id' | 'user_id' | 'created_at'>): void {
  getDb().prepare(
    'UPDATE personal_suscripciones SET nombre = ?, importe = ?, cobro = ?, periodicidad = ?, comentario = ?, categoria = ?, banco = ? WHERE id = ? AND user_id = ?'
  ).run(data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario, data.categoria, data.banco, id, userId);
}
export function deletePersonalSuscripcion(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_suscripciones WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Hogar: Recurrentes ─────────────────────────────────────────────────────

export interface HogarRecurrente {
  id: number; nombre: string; importe: number;
  cobro: string | null; periodicidad: 'mensual' | 'trimestral' | 'anual'; comentario: string | null;
  categoria: string | null; banco: string | null;
  created_at: string;
}
export type HogarRecurrenteInput = Omit<HogarRecurrente, 'id' | 'created_at'>;

export function getHogarRecurrentes(): HogarRecurrente[] {
  return getDb().prepare('SELECT * FROM hogar_recurrentes ORDER BY nombre').all() as HogarRecurrente[];
}
export function createHogarRecurrente(data: HogarRecurrenteInput): void {
  getDb().prepare(
    'INSERT INTO hogar_recurrentes (nombre, importe, cobro, periodicidad, comentario, categoria, banco) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario, data.categoria, data.banco);
}
export function updateHogarRecurrente(id: number, data: HogarRecurrenteInput): void {
  getDb().prepare(
    'UPDATE hogar_recurrentes SET nombre = ?, importe = ?, cobro = ?, periodicidad = ?, comentario = ?, categoria = ?, banco = ? WHERE id = ?'
  ).run(data.nombre, data.importe, data.cobro, data.periodicidad, data.comentario, data.categoria, data.banco, id);
}
export function deleteHogarRecurrente(id: number): void {
  getDb().prepare('DELETE FROM hogar_recurrentes WHERE id = ?').run(id);
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
  fecha_objetivo: string; aportado: number; emoji: string | null; created_at: string;
}

export function getPersonalAhorroObjetivos(userId: number): PersonalAhorroObjetivo[] {
  return getDb().prepare('SELECT * FROM personal_ahorro_objetivos WHERE user_id = ? ORDER BY fecha_objetivo').all(userId) as PersonalAhorroObjetivo[];
}
export function createPersonalAhorroObjetivo(userId: number, data: { nombre: string; objetivo: number; fecha_objetivo: string; emoji: string | null }): void {
  getDb().prepare(
    'INSERT INTO personal_ahorro_objetivos (user_id, nombre, objetivo, fecha_objetivo, emoji) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, data.nombre, data.objetivo, data.fecha_objetivo, data.emoji);
}
export function updatePersonalAhorroObjetivoDatos(id: number, userId: number, data: { nombre: string; objetivo: number; fecha_objetivo: string; emoji: string | null }): void {
  getDb().prepare(
    'UPDATE personal_ahorro_objetivos SET nombre = ?, objetivo = ?, fecha_objetivo = ?, emoji = ? WHERE id = ? AND user_id = ?'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo, data.emoji, id, userId);
}
export function updatePersonalAhorroObjetivoAportado(id: number, userId: number, aportado: number): void {
  getDb().prepare('UPDATE personal_ahorro_objetivos SET aportado = ? WHERE id = ? AND user_id = ?').run(aportado, id, userId);
}
export function deletePersonalAhorroObjetivo(id: number, userId: number): void {
  getDb().prepare('DELETE FROM personal_ahorro_objetivos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Hogar: Ahorro anual ─────────────────────────────────────────────────────

export interface Ahorro {
  id: number; anio: number; objetivo_anual: number;
  meses: AhorroMes[];
}
export interface AhorroMes { id: number; ahorro_id: number; mes: number; aportado: number; }

export function getAhorro(anio: number): Ahorro {
  const db = getDb();
  let row = db.prepare('SELECT * FROM ahorro WHERE anio = ?').get(anio) as { id: number; anio: number; objetivo_anual: number } | null;
  if (!row) {
    db.prepare('INSERT INTO ahorro (anio, objetivo_anual) VALUES (?, 0)').run(anio);
    row = db.prepare('SELECT * FROM ahorro WHERE anio = ?').get(anio) as { id: number; anio: number; objetivo_anual: number };
  }
  // Ensure all 12 months exist
  for (let m = 1; m <= 12; m++) {
    db.prepare('INSERT OR IGNORE INTO ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, 0)').run(row.id, m);
  }
  const meses = db.prepare('SELECT * FROM ahorro_mes WHERE ahorro_id = ? ORDER BY mes').all(row.id) as AhorroMes[];
  return { ...row, meses };
}

export function updateAhorroObjetivo(anio: number, objetivoAnual: number): Ahorro {
  const db = getDb();
  db.prepare('INSERT INTO ahorro (anio, objetivo_anual) VALUES (?, ?) ON CONFLICT(anio) DO UPDATE SET objetivo_anual = excluded.objetivo_anual').run(anio, objetivoAnual);
  return getAhorro(anio);
}

export function updateAhorroMes(anio: number, mes: number, aportado: number): void {
  const db = getDb();
  const row = db.prepare('SELECT id FROM ahorro WHERE anio = ?').get(anio) as { id: number } | null;
  if (!row) return;
  db.prepare('INSERT INTO ahorro_mes (ahorro_id, mes, aportado) VALUES (?, ?, ?) ON CONFLICT(ahorro_id, mes) DO UPDATE SET aportado = excluded.aportado').run(row.id, mes, aportado);
}

// ── Hogar: Objetivos de ahorro ─────────────────────────────────────────────

export interface AhorroObjetivo {
  id: number; nombre: string; objetivo: number;
  fecha_objetivo: string; aportado: number; emoji: string | null; created_at: string;
}

export function getAhorroObjetivos(): AhorroObjetivo[] {
  return getDb().prepare('SELECT * FROM ahorro_objetivos ORDER BY fecha_objetivo').all() as AhorroObjetivo[];
}
export function createAhorroObjetivo(data: { nombre: string; objetivo: number; fecha_objetivo: string; emoji: string | null }): void {
  getDb().prepare(
    'INSERT INTO ahorro_objetivos (nombre, objetivo, fecha_objetivo, emoji) VALUES (?, ?, ?, ?)'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo, data.emoji);
}
export function updateAhorroObjetivoDatos(id: number, data: { nombre: string; objetivo: number; fecha_objetivo: string; emoji: string | null }): void {
  getDb().prepare(
    'UPDATE ahorro_objetivos SET nombre = ?, objetivo = ?, fecha_objetivo = ?, emoji = ? WHERE id = ?'
  ).run(data.nombre, data.objetivo, data.fecha_objetivo, data.emoji, id);
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

export interface PersonalMes { id: number; user_id: number; mes: number; anio: number; bloqueado: number; }

function autoLockPersonalMes(db: Database.Database, m: PersonalMes): PersonalMes {
  if (!m.bloqueado && esMesVencido(m.mes, m.anio)) {
    db.prepare('UPDATE personal_meses SET bloqueado = 1 WHERE id = ?').run(m.id);
    return { ...m, bloqueado: 1 };
  }
  return m;
}

export function getPersonalMeses(userId: number): PersonalMes[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM personal_meses WHERE user_id = ? ORDER BY anio DESC, mes DESC'
  ).all(userId) as PersonalMes[];
  return rows.map(m => autoLockPersonalMes(db, m));
}

export function getPersonalMes(userId: number, mes: number, anio: number): PersonalMes | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM personal_meses WHERE user_id = ? AND mes = ? AND anio = ?').get(userId, mes, anio) as PersonalMes | undefined;
  return row ? autoLockPersonalMes(db, row) : undefined;
}

export function personalMesExists(userId: number, mes: number, anio: number): boolean {
  return !!getDb().prepare('SELECT 1 FROM personal_meses WHERE user_id = ? AND mes = ? AND anio = ?').get(userId, mes, anio);
}

export function createPersonalMes(userId: number, mes: number, anio: number): void {
  getDb().prepare('INSERT OR IGNORE INTO personal_meses (user_id, mes, anio) VALUES (?, ?, ?)').run(userId, mes, anio);
}

export function setPersonalMesBloqueado(userId: number, mes: number, anio: number, bloqueado: boolean): void {
  getDb().prepare('UPDATE personal_meses SET bloqueado = ? WHERE user_id = ? AND mes = ? AND anio = ?').run(bloqueado ? 1 : 0, userId, mes, anio);
}

export function isPersonalMesBloqueado(userId: number, anio: number, mes: number): boolean {
  const row = getDb().prepare('SELECT bloqueado FROM personal_meses WHERE user_id = ? AND mes = ? AND anio = ?').get(userId, mes, anio) as { bloqueado: number } | undefined;
  return !!row?.bloqueado;
}

export function getPersonalGastoMesRef(id: number, userId: number): { anio: number; mes: number } | undefined {
  return getDb().prepare('SELECT anio, mes FROM personal_gastos_mes WHERE id = ? AND user_id = ?').get(id, userId) as { anio: number; mes: number } | undefined;
}

export function getPersonalIngresoMesRef(id: number, userId: number): { anio: number; mes: number } | undefined {
  return getDb().prepare('SELECT anio, mes FROM personal_ingresos_mes WHERE id = ? AND user_id = ?').get(id, userId) as { anio: number; mes: number } | undefined;
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

// 'suscripciones' es el nombre interno histórico de los Recurrentes de Personal; 'recurrentes' es el de Hogar
export type PresupuestoAutoTipo = 'suscripciones' | 'recurrentes' | 'ahorro' | 'objetivos';

export interface PresupuestoAutoConfig {
  tipo: PresupuestoAutoTipo;
  banco: string | null;
  categoria: string | null;
  redondeo: number;
  desglose: number;
}

export interface PresupuestoAutoOpts {
  redondeo?: boolean;
  desglose?: boolean;
}

const flag = (v: boolean | undefined) => (v === undefined ? null : v ? 1 : 0);

export function getPresupuestoAutoConfigs(userId: number): PresupuestoAutoConfig[] {
  return getDb().prepare(
    'SELECT tipo, banco, categoria, redondeo, desglose FROM personal_presupuesto_auto WHERE user_id = ?'
  ).all(userId) as PresupuestoAutoConfig[];
}

export function upsertPresupuestoAuto(userId: number, tipo: string, banco: string | null, categoria: string | null, opts: PresupuestoAutoOpts = {}): void {
  const r = flag(opts.redondeo);
  const d = flag(opts.desglose);
  getDb().prepare(
    `INSERT INTO personal_presupuesto_auto (user_id, tipo, banco, categoria, redondeo, desglose) VALUES (?, ?, ?, ?, COALESCE(?, 1), COALESCE(?, 0))
     ON CONFLICT(user_id, tipo) DO UPDATE SET banco = excluded.banco, categoria = excluded.categoria,
       redondeo = CASE WHEN ? IS NULL THEN redondeo ELSE excluded.redondeo END,
       desglose = CASE WHEN ? IS NULL THEN desglose ELSE excluded.desglose END`
  ).run(userId, tipo, banco, categoria, r, d, r, d);
}

// ── Hogar: Presupuesto auto-config ─────────────────────────────────────────

export function getPresupuestoAutoConfigsHogar(): PresupuestoAutoConfig[] {
  return getDb().prepare('SELECT tipo, banco, categoria, redondeo, desglose FROM presupuesto_auto').all() as PresupuestoAutoConfig[];
}

export function upsertPresupuestoAutoHogar(tipo: string, banco: string | null, categoria: string | null, opts: PresupuestoAutoOpts = {}): void {
  const r = flag(opts.redondeo);
  const d = flag(opts.desglose);
  getDb().prepare(
    `INSERT INTO presupuesto_auto (tipo, banco, categoria, redondeo, desglose) VALUES (?, ?, ?, COALESCE(?, 1), COALESCE(?, 0))
     ON CONFLICT(tipo) DO UPDATE SET banco = excluded.banco, categoria = excluded.categoria,
       redondeo = CASE WHEN ? IS NULL THEN redondeo ELSE excluded.redondeo END,
       desglose = CASE WHEN ? IS NULL THEN desglose ELSE excluded.desglose END`
  ).run(tipo, banco, categoria, r, d, r, d);
}

// ── App settings ───────────────────────────────────────────────────────────

export function getAppSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setAppSetting(key: string, value: string): void {
  getDb().prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

// ── Web Push ───────────────────────────────────────────────────────────────

export type PushScope = 'hogar' | 'personal';

export interface PushSubscriptionRow {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  notify_hogar: number;
  notify_personal: number;
  user_agent: string | null;
  created_at: string;
}

const scopeColumn = (scope: PushScope) => (scope === 'hogar' ? 'notify_hogar' : 'notify_personal');

export function getPushSubscription(endpoint: string, userId: number): PushSubscriptionRow | null {
  return (getDb().prepare('SELECT * FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').get(endpoint, userId) as PushSubscriptionRow | undefined) ?? null;
}

/** Guarda la suscripción del dispositivo y activa/desactiva un ámbito; devuelve la fila resultante */
export function savePushSubscription(
  userId: number,
  sub: { endpoint: string; p256dh: string; auth: string; userAgent: string | null },
  scope: PushScope,
  enabled: boolean,
): PushSubscriptionRow {
  const db = getDb();
  const col = scopeColumn(scope);
  // Un endpoint pertenece a un único navegador: si otro usuario inicia sesión en él, pasa a ser suyo
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, ${col}) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       notify_hogar    = CASE WHEN user_id = excluded.user_id THEN notify_hogar ELSE 0 END,
       notify_personal = CASE WHEN user_id = excluded.user_id THEN notify_personal ELSE 0 END,
       user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`
  ).run(userId, sub.endpoint, sub.p256dh, sub.auth, sub.userAgent, enabled ? 1 : 0);
  db.prepare(`UPDATE push_subscriptions SET ${col} = ? WHERE endpoint = ?`).run(enabled ? 1 : 0, sub.endpoint);
  return getPushSubscription(sub.endpoint, userId)!;
}

export function deletePushSubscription(endpoint: string): void {
  getDb().prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

/** Suscripciones que deben recibir avisos de un ámbito. Hogar: solo usuarios con acceso a Hogar */
export function getPushSubscriptionsForScope(scope: PushScope): (PushSubscriptionRow & { role: string })[] {
  const col = scopeColumn(scope);
  const rows = getDb().prepare(
    `SELECT s.*, u.role FROM push_subscriptions s JOIN users u ON u.id = s.user_id WHERE s.${col} = 1`
  ).all() as (PushSubscriptionRow & { role: string })[];
  if (scope === 'hogar' && !isHogarActivated()) return rows.filter(r => r.role === 'admin');
  return rows;
}

/** Marca un aviso como enviado; false si ya se había enviado antes */
export function markPushEnviado(clave: string): boolean {
  return getDb().prepare('INSERT OR IGNORE INTO push_enviados (clave) VALUES (?)').run(clave).changes > 0;
}

export function prunePushEnviados(dias = 90): void {
  getDb().prepare(`DELETE FROM push_enviados WHERE enviado_at < datetime('now', ?)`).run(`-${dias} days`);
}

export function isPushEnviado(clave: string): boolean {
  return !!getDb().prepare('SELECT 1 FROM push_enviados WHERE clave = ?').get(clave);
}
