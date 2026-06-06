import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPersonalMeses } from '@/lib/db';

export default async function PersonalMesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const meses = getPersonalMeses(session.id);
  if (meses.length > 0) {
    redirect(`/personal/mes/${meses[0].anio}/${meses[0].mes}`);
  }

  // No months yet — redirect to current month URL so the page can show the creation UI
  const now = new Date();
  redirect(`/personal/mes/${now.getFullYear()}/${now.getMonth() + 1}`);
}
