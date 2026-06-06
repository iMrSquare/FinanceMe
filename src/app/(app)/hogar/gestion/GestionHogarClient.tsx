'use client';
import { useEffect, useState } from 'react';
import type { Categoria } from '@/lib/db';
import { CircularColorPicker, autoText } from '@/components/ColorDots';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PencilIcon, TrashIcon } from '@/components/icons';

const inputStyle = { background: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--btn-border)' };

function GestionSection({ title, tipo, color, items, onRefresh }: {
  title: string;
  tipo: 'gasto' | 'prestamo';
  color: string;
  items: Categoria[];
  onRefresh: () => void;
}) {
  const [newNombre, setNewNombre] = useState('');
  const [newColor, setNewColor] = useState(color);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState(color);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => Promise<void> } | null>(null);

  async function addNew() {
    if (!newNombre.trim()) return;
    setSaving(true);
    await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, nombre: newNombre.trim(), color: newColor }) });
    setNewNombre(''); setNewColor(color); setSaving(false); onRefresh();
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    const orig = items.find(i => i.id === editId)!;
    await fetch(`/api/categorias/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: editNombre, color: editColor, nombreAnterior: orig.nombre, tipo }) });
    setEditId(null); setSaving(false); onRefresh();
  }

  function startEdit(item: Categoria) { setEditId(item.id); setEditNombre(item.nombre); setEditColor(item.color); }

  function del(item: Categoria) {
    setConfirm({ msg: `¿Eliminar "${item.nombre}"?`, fn: async () => {
      await fetch(`/api/categorias/${item.id}`, { method: 'DELETE' }); onRefresh();
    }});
  }

  return (
    <>
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{items.length} {items.length === 1 ? 'entrada' : 'entradas'}</p>
        </div>

        <div className="px-6 py-4 space-y-2 min-h-[80px]">
          {items.length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Sin entradas — añade la primera abajo</p>
          )}
          {items.map(item => (
            <div key={item.id} className="rounded-2xl p-3" style={{ border: '1px solid var(--divider)', background: 'var(--bg-page)' }}>
              {editId === item.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: editColor, color: autoText(editColor) }}>{editNombre || '…'}</span>
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                    className="flex-1 text-sm rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border"
                    style={inputStyle} autoFocus />
                  <CircularColorPicker value={editColor} onChange={setEditColor} />
                  <button onClick={saveEdit} disabled={saving || !editNombre.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? '…' : 'OK'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-2 py-1.5 rounded-xl text-xs border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--btn-border)' }}>✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: item.color, color: autoText(item.color) }}>{item.nombre}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.nombre}</span>
                  <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                    <PencilIcon />
                  </button>
                  <button onClick={() => del(item)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--divider)', paddingTop: '16px' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Añadir nueva</p>
          <div className="flex items-center gap-2">
            <input value={newNombre} onChange={e => setNewNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNew()}
              placeholder="Nombre…"
              className="flex-1 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 border"
              style={inputStyle} />
            <CircularColorPicker value={newColor} onChange={setNewColor} />
            <button onClick={addNew} disabled={!newNombre.trim() || saving}
              className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
              +
            </button>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={async () => { await confirm.fn(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

export default function GestionHogarClient() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [bancos, setBancos] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    const [c, b] = await Promise.all([
      fetch('/api/categorias?tipo=gasto').then(r => r.json()),
      fetch('/api/categorias?tipo=prestamo').then(r => r.json()),
    ]);
    setCategorias(Array.isArray(c) ? c : []);
    setBancos(Array.isArray(b) ? b : []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Gestión</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Categorías y bancos usados en Presupuesto y Mes</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GestionSection
            title="Categorías"
            tipo="gasto"
            color="#6366f1"
            items={categorias}
            onRefresh={fetchAll}
          />
          <GestionSection
            title="Bancos"
            tipo="prestamo"
            color="#64748b"
            items={bancos}
            onRefresh={fetchAll}
          />
        </div>
      )}
    </div>
  );
}
