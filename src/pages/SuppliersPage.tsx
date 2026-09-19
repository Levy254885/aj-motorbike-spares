import { FormEvent, useEffect, useState } from 'react';
import { listSuppliers, createSupplier } from '../services/suppliers';
import type { Supplier } from '../types';
import { Plus } from 'lucide-react';

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => listSuppliers().then(setItems).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createSupplier({ name: name.trim(), phone: phone.trim() || undefined });
      setOpen(false); setName(''); setPhone('');
      await load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Suppliers</h1>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {loading ? <div className="h-24 animate-pulse rounded-lg bg-zinc-100" /> : items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-500">No suppliers yet.</p>
      ) : (
        <div className="divide-y rounded-lg border border-zinc-200 bg-white">
          {items.map((s) => (
            <div key={s.id} className="px-4 py-3">
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-zinc-500">{s.phone || '—'}</p>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={onSubmit} className="relative w-full max-w-sm space-y-3 rounded-xl bg-white p-4">
            <h3 className="font-semibold">New supplier</h3>
            <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950">{saving ? 'Saving…' : 'Save'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
