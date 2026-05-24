interface Props {
  message: string;
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  detail = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="glass-card rounded-3xl p-8 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.12)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>{message}</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{detail}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)', background: 'transparent' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-red-500/30"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
