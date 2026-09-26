'use client';

import Button from './ui/Button';
import Modal from './ui/Modal';

interface Props {
  message: string;
  detail?: string;
  confirmLabel?: string;
  /** false = acción no destructiva (botón con el acento) */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  detail = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal title={message} onClose={onCancel} width="420px"
      footer={<>
        <Button onClick={onCancel}>Cancelar</Button>
        {danger
          ? <Button variant="danger" onClick={onConfirm} className="!bg-money-out !text-[var(--on-accent)] !border-transparent hover:!brightness-95">{confirmLabel}</Button>
          : <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>}
      </>}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detail}</p>
    </Modal>
  );
}
