export interface AportacionMes { aportado: number; }

// Cuota mensual recalculada: lo que falta para el objetivo anual repartido entre los
// meses que quedan del año en curso, según lo aportado hasta ahora. El mes actual solo
// cuenta como "restante" si todavía no se ha registrado ninguna aportación en él.
// Fuera del año en curso (histórico) se usa la media simple objetivo/12.
export function objetivoMensualAhorro(objetivoAnual: number, meses: AportacionMes[], anio: number, hoy: Date = new Date()): number {
  if (objetivoAnual <= 0) return 0;
  if (anio !== hoy.getFullYear()) return objetivoAnual / 12;

  const mesActual = hoy.getMonth();
  const yaAportadoMesActual = meses[mesActual]?.aportado !== 0;
  const totalHastaAhora = meses.slice(0, mesActual + 1).reduce((s, m) => s + m.aportado, 0);
  const mesesRestantes = Math.max(yaAportadoMesActual ? 11 - mesActual : 12 - mesActual, 1);
  return (objetivoAnual - totalHastaAhora) / mesesRestantes;
}
