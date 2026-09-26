import { BackToModulos } from '@/components/modulos/ModulosHub';
import AhorroTabs from './AhorroTabs';

export const metadata = { title: 'Ahorro Personal — FinanceMe' };

export default function AhorroPage() {
  return (
    <div className="space-y-6">
      <BackToModulos href="/personal/modulos" />
      <AhorroTabs />
    </div>
  );
}
