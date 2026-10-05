import AhorroView from '@/components/ahorro/AhorroView';

export const metadata = { title: 'Personal · Ahorro anual' };

export default function AhorroPage() {
  return <AhorroView scope="personal" vista="anual" />;
}
