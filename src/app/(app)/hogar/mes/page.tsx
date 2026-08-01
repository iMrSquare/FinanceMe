import { redirect } from 'next/navigation';
import { seedDatabase } from '@/lib/seed';
import { getMeses } from '@/lib/db';

export default function HogarMesPage() {
  seedDatabase();

  const meses = getMeses();
  if (meses.length > 0) {
    redirect(`/hogar/mes/${meses[0].anio}/${meses[0].mes}`);
  }

  // Sin meses todavía — redirige al mes actual para que la página muestre la UI de creación
  const now = new Date();
  redirect(`/hogar/mes/${now.getFullYear()}/${now.getMonth() + 1}`);
}
