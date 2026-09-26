import { createElement, type SVGProps } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';

/** Icono de categoría por su id guardado (etiqueta genérica si no existe) */
export default function CategoryIconGlyph({ iconId, ...props }: { iconId: string | null | undefined } & SVGProps<SVGSVGElement>) {
  return createElement(getCategoryIcon(iconId), { 'aria-hidden': true, ...props });
}
