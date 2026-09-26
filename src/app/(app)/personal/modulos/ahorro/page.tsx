import AhorroView from '@/components/ahorro/AhorroView';

export const metadata = { title: 'Ahorro anual — FinanceMe Personal' };

export default function AhorroPage() {
  return <AhorroView scope="personal" vista="anual" />;
}
