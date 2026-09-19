import { FormEvent, useEffect, useState } from 'react';
import { listExpenses, createExpense } from '../services/expenses';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Expense } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';

const CATS = ['Rent','Transport','Utilities','Salaries','Repairs','Supplies','Marketing','Other'];

export default function ExpensesPage() {
  const { appUser } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Other', amount: 0, date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const load = () => listExpenses().then(setItems).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser || !form.name.trim() || form.amount <= 0) return;
    setSaving(true);
    try {
      await createExpense({
        name: form.name.trim(), category: form.category, amount: form.amount, date: form.date,
        recordedBy: appUser.uid, recordedByName: appUser.displayName || appUser.email,
      });
      setOpen(false);
      setForm({ name: '', category: 'Other', amount: 0, date: new Date().toISOString().slice(0, 10) });
      await load();
    } finally { setSaving(false); }
  };

  const total = items.reduce((s, x) => s + (x.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Expenses</h1>
          <p className="text-sm text-zinc-500">Total: {formatCurrency(total)}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {loading ? <div className="h-24 animate-pulse rounded-lg bg-zinc-100" /> : items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-500">No expenses yet.</p>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {items.map((x) => (
            <div key={x.id} className="flex justify-between px-4 py-3">
              <div>
                <p className="font-medium">{x.name}</p>
                <p className="text-xs text-zinc-500">{x.category} · {formatDate(x.date)}</p>
              </div>
              <p className="font-semibold tabular-nums">{formatCurrency(x.amount)}</p>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={onSubmit} className="relative w-full max-w-sm space-y-3 rounded-xl bg-white p-4">
            <h3 className="font-semibold">New expense</h3>
            <input required placeholder="Title" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} required placeholder="Amount" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950">{saving ? 'Saving…' : 'Save'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
