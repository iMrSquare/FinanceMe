import { redirect } from 'next/navigation';
import { getSession, canEdit } from '@/lib/auth';
import GestionHogarClient from './GestionHogarClient';

export const metadata = { title: 'Gestión — FinanceMe Hogar' };

export default async function GestionHogarPage() {
  const session = await getSession();
  if (!canEdit(session?.role ?? 'visor')) redirect('/hogar/presupuesto');
  return <GestionHogarClient />;
}
