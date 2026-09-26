import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, rutaInicio } from '@/lib/db';

// Entrada de la app (y de la PWA): abre el modo que el usuario eligió en Apariencia
export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const user = getUserById(session.id);
  redirect(user ? rutaInicio(user) : '/personal');
}
