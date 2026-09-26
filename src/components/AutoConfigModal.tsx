'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Switch from './ui/Switch';

export interface AutoConfigValues {
  banco: string | null;
  categoria: string | null;
  redondeo?: boolean;
}

interface Props {
  titulo: string;
  /** Se mantiene por compatibilidad; el acento sigue al ámbito activo */
  color?: string;
  current: { banco: string | null; categoria: string | null; redondeo?: number; desglose?: number };
  categorias: { nombre: string }[];
  bancos: { nombre: string }[];
  /** Muestra las opciones propias de Recurrentes (redondeo); el modo se elige en Recurrentes */
  recurrentes?: boolean;
  recurrentesHref?: string;
  onClose: () => void;
  onSave: (values: AutoConfigValues) => Promise<void>;
}

export default function AutoConfigModal({ titulo, current, categorias, bancos, recurrentes, recurrentesHref, onClose, onSave }: Props) {
  const [banco, setBanco] = useState(current.banco ?? '');
  const [categoria, setCategoria] = useState(current.categoria ?? '');
  const [redondeo, setRedondeo] = useState((current.redondeo ?? 1) === 1);
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    await onSave({ banco: banco || null, categoria: categoria || null, ...(recurrentes ? { redondeo } : {}) });
  }

  return (
    <Modal title={`Configurar ${titulo.toLowerCase()}`} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </>}>
      <form onSubmit={e => { e.preventDefault(); guardar(); }}>
        {recurrentes && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
            Se añaden al Mes como una sola línea con el total mensual. Para añadir cada recurrente por separado, con su fecha,
            categoría y banco, cámbialo en{' '}
            <Link href={recurrentesHref ?? '#'} className="font-medium underline" style={{ color: 'var(--accent-mode)' }}>Recurrentes</Link>.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="ac-cat" className="fm-label">Categoría</label>
            <select id="ac-cat" className="fm-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ac-banco" className="fm-label">Banco</label>
            <select id="ac-banco" className="fm-input" value={banco} onChange={e => setBanco(e.target.value)}>
              <option value="">Sin banco</option>
              {bancos.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>
        </div>
        {recurrentes && (
          <Switch checked={redondeo} onChange={setRedondeo} label="Redondear al alza" description="Redondea el total mensual al múltiplo de 5 € superior" />
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
