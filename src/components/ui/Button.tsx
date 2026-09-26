import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const BASE = 'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-[var(--radius-control)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-mode)] [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0';
const SIZES: Record<Size, string> = { md: 'min-h-11 px-4 text-[15px]', sm: 'min-h-9 px-3 text-sm' };
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-mode text-on-accent hover:brightness-[.93]',
  secondary: 'border border-[var(--btn-border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--btn-hover)]',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--btn-hover)] hover:text-[var(--text-primary)]',
  danger: 'border border-[var(--btn-border)] bg-[var(--bg-card)] text-money-out hover:bg-[color-mix(in_srgb,var(--money-out)_8%,transparent)]',
};

export function buttonClasses(variant: Variant = 'secondary', size: Size = 'md', extra = '') {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${extra}`;
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Oculta el texto por debajo de 640px (queda como aria-label) */
  compactOnMobile?: boolean;
  href?: string;
}

export default function Button({ variant = 'secondary', size = 'md', icon, compactOnMobile, href, className = '', children, type = 'button', ...rest }: Props) {
  const label = compactOnMobile && typeof children === 'string' ? children : undefined;
  const content = (
    <>
      {icon}
      {children && (compactOnMobile ? <span className="hidden sm:inline">{children}</span> : children)}
    </>
  );
  const cls = buttonClasses(variant, size, `${compactOnMobile ? 'max-sm:px-0 max-sm:w-11' : ''} ${className}`);
  if (href) return <Link href={href} className={cls} aria-label={label}>{content}</Link>;
  return <button type={type} className={cls} aria-label={label ?? rest['aria-label']} {...rest}>{content}</button>;
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={`inline-grid place-items-center w-10 h-10 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:bg-[var(--btn-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-mode)] disabled:opacity-40 [&_svg]:w-[17px] [&_svg]:h-[17px] ${className}`}
      {...rest}>
      {children}
    </button>
  );
}
