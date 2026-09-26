import RecurrentesClient from '@/components/recurrentes/RecurrentesClient';

export const metadata = { title: 'Recurrentes — FinanceMe Personal' };

export default function PersonalRecurrentesPage() {
  return <RecurrentesClient scope="personal" />;
}
