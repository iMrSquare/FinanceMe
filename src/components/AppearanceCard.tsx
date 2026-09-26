'use client';
import type { SessionUser } from '@/lib/auth';
import { SunIcon } from './icons';
import SettingsCard from './ui/SettingsCard';
import { useAppearance, ThemePicker, ColorModePicker, AccentPickers, ModoInicioPicker } from './AppearanceControls';

interface Props { session: SessionUser; hogarDisponible: boolean; }

export default function AppearanceCard({ session, hogarDisponible }: Props) {
  const a = useAppearance(session);

  return (
    <SettingsCard title="Apariencia" icon={<SunIcon />}
      description="Tema, modo claro u oscuro, color de acento y modo con el que se abre la aplicación.">
      <div className="space-y-5">
        <div>
          <p id="apariencia-tema" className="fm-label">Tema</p>
          <ThemePicker a={a} labelId="apariencia-tema" />
        </div>

        <fieldset>
          <legend className="fm-label">Modo</legend>
          <ColorModePicker a={a} />
        </fieldset>

        <fieldset>
          <legend className="fm-label">Color de acento</legend>
          <AccentPickers a={a} />
        </fieldset>

        <fieldset>
          <legend className="fm-label">Al iniciar sesión, abrir</legend>
          <ModoInicioPicker a={a} hogarDisponible={hogarDisponible} />
        </fieldset>
      </div>

      {a.saveErr && <p role="alert" className="text-sm text-money-out font-medium mt-4">{a.saveErr}</p>}
    </SettingsCard>
  );
}
