import RecurrentesClient from '@/components/recurrentes/RecurrentesClient';

export const metadata = { title: 'Personal · Recurrentes' };

export default function PersonalRecurrentesPage() {
  return <RecurrentesClient scope="personal" />;
}
