import { redirect } from 'next/navigation';
import { seedDatabase } from '@/lib/seed';

export default function HogarMesPage() {
  seedDatabase();
  const now = new Date();
  redirect(`/hogar/mes/${now.getFullYear()}/${now.getMonth() + 1}`);
}
