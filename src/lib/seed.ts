import { getDb, getOrCreateMes } from './db';

export function seedDatabase() {
  const db = getDb();

  const hasData = db.prepare('SELECT COUNT(*) as count FROM meses').get() as { count: number };
  if (hasData.count > 0) return;

  // Categorías por defecto (always needed)
  seedCategorias(db);

  // Skip sample data in production
  if (process.env.NODE_ENV === 'production') return;

  // Abril 2026
  const abril = getOrCreateMes(4, 2026);

  const insertIngreso = db.prepare('INSERT INTO ingresos (mes_id, inquilino, aportacion) VALUES (?, ?, ?)');
  insertIngreso.run(abril.id, 'Titular', 0);
  insertIngreso.run(abril.id, 'Socio', 0);

  const insertGasto = db.prepare(
    'INSERT INTO gastos (mes_id, gasto, fecha, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertGasto.run(abril.id, 'Streaming', null, 'Otros', 6.00, '13/mes');
  insertGasto.run(abril.id, 'Comunidad', null, 'Consumo', 45.00, '10/mes');
  insertGasto.run(abril.id, 'Música', null, 'Otros', 7.00, '23/mes (plan familiar)');
  insertGasto.run(abril.id, 'Internet', null, 'Consumo', 35.00, '27/mes');
  insertGasto.run(abril.id, 'Agua', null, 'Consumo', 0, null);
  insertGasto.run(abril.id, 'Luz', null, 'Consumo', 0, null);

  const insertPrestamo = db.prepare(
    'INSERT INTO prestamos (mes_id, gasto, fecha, categoria, importe, comentario) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertPrestamo.run(abril.id, 'Préstamo personal', null, 'BBVA', 120.00, '2/mes');
  insertPrestamo.run(abril.id, 'Seguro Hogar', null, 'Cajamar', 24.00, '25/mes');
  insertPrestamo.run(abril.id, 'Seguro Vida', null, 'Cajamar', 50.00, '25/mes');
  insertPrestamo.run(abril.id, 'Hipoteca', null, 'Cajamar', 500.00, '29/mes');

  // Mayo 2026 (mes actual)
  getOrCreateMes(5, 2026);
}

function seedCategorias(db: ReturnType<typeof getDb>) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO categorias (tipo, nombre, color) VALUES (?, ?, ?)'
  );
  insert.run('gasto', 'Salida',  '#e5e7eb');
  insert.run('gasto', 'Otros',   '#bbf7d0');
  insert.run('gasto', 'Consumo', '#e9d5ff');
  insert.run('gasto', 'Comida',  '#fed7aa');
  insert.run('prestamo', 'BBVA',    '#bfdbfe');
  insert.run('prestamo', 'Cajamar', '#fbcfe8');
  insert.run('luz', 'Endesa',    '#fbbf24');
  insert.run('luz', 'Iberdrola', '#34d399');
  insert.run('luz', 'Naturgy',   '#f97316');
  insert.run('luz', 'Repsol',    '#a78bfa');
  insert.run('agua', 'Hidrogea',  '#38bdf8');
  insert.run('agua', 'Aqualia',   '#06b6d4');
  insert.run('agua', 'Aguas',     '#0ea5e9');
}
