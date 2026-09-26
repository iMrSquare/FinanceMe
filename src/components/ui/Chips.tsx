import type { CSSProperties } from 'react';
import CategoryIconGlyph from '@/components/CategoryIconGlyph';
import { BANK_ICON } from '@/lib/categoryIcons';

const vars = (color?: string | null): CSSProperties | undefined => (color ? ({ '--fm-c': color } as CSSProperties) : undefined);

/** Categoría: icono con su color + nombre en texto neutro */
export function CategoryChip({ nombre, color, icono }: { nombre: string | null; color?: string | null; icono?: string | null }) {
  if (!nombre) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return <span className="fm-chip" style={vars(color)}><CategoryIconGlyph iconId={icono} /><span>{nombre}</span></span>;
}

/** Banco: el mismo icono para todos, con el color del banco */
export function BankChip({ nombre, color }: { nombre: string | null; color?: string | null }) {
  if (!nombre) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return <span className="fm-chip" style={vars(color)}><BANK_ICON aria-hidden="true" /><span>{nombre}</span></span>;
}

/** Icono cuadrado de categoría (listas en móvil, gestión) */
export function CategoryBadge({ color, icono, bank }: { color?: string | null; icono?: string | null; bank?: boolean }) {
  return (
    <span className="fm-caticon" style={vars(color)} aria-hidden="true">
      {bank ? <BANK_ICON /> : <CategoryIconGlyph iconId={icono} />}
    </span>
  );
}
