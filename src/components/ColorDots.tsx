export function autoText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 145 ? '#1f2937' : '#ffffff';
}

export function CircularColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <label className="relative w-8 h-8 rounded-full cursor-pointer shrink-0 overflow-hidden" style={{ outline: `3px solid ${value}`, outlineOffset: '2px' }}>
      <div className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
      />
    </label>
  );
}
