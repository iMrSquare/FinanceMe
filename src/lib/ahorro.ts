export interface AportacionMes { aportado: number; }
export type ModoAhorro = 'anual' | 'mensual';
// objetivo_anual siempre guarda el total del año; en modo mensual es cuota × 12
export interface AhorroObjetivoAnual { objetivo_anual: number; meses: AportacionMes[]; modo?: ModoAhorro | string | null; }

export const esMensual = (a: Pick<AhorroObjetivoAnual, 'modo'>) => a.modo === 'mensual';

// Cuota mensual del objetivo de ahorro.
// - Modo mensual: cuota fija (objetivo anual ÷ 12), no se recalcula.
// - Modo anual: lo que falta para el objetivo repartido entre los meses que quedan del año
//   en curso, según lo aportado hasta ahora. El mes actual solo cuenta como "restante" si
//   todavía no se ha registrado ninguna aportación en él. Fuera del año en curso (histórico)
//   se usa la media simple objetivo/12.
export function objetivoMensualAhorro(ahorro: AhorroObjetivoAnual, anio: number, hoy: Date = new Date()): number {
  const { objetivo_anual: objetivoAnual, meses } = ahorro;
  if (objetivoAnual <= 0) return 0;
  if (esMensual(ahorro) || anio !== hoy.getFullYear()) return objetivoAnual / 12;

  const mesActual = hoy.getMonth();
  const yaAportadoMesActual = meses[mesActual]?.aportado !== 0;
  const totalHastaAhora = meses.slice(0, mesActual + 1).reduce((s, m) => s + m.aportado, 0);
  const mesesRestantes = Math.max(yaAportadoMesActual ? 11 - mesActual : 12 - mesActual, 1);
  return (objetivoAnual - totalHastaAhora) / mesesRestantes;
}

// Texto que acompaña a la fila automática «Ahorro mensual» (Presupuesto y Mes)
export function descripcionCuotaAhorro(ahorro: AhorroObjetivoAnual, fmt: (n: number) => string): string {
  return esMensual(ahorro)
    ? `Objetivo fijo de ${fmt(ahorro.objetivo_anual / 12)} al mes`
    : `Objetivo de ${fmt(ahorro.objetivo_anual)} al año, recalculado según lo aportado`;
}

// Normaliza un valor externo (API, copia importada) a un modo válido
export const modoAhorro = (v: unknown): ModoAhorro => (v === 'mensual' ? 'mensual' : 'anual');
