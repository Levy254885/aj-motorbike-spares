import { FormEvent, useEffect, useState } from 'react';
import { listPurchases, createPurchase } from '../services/purchases';
import { listProducts } from '../services/products';
import { listSuppliers } from '../services/suppliers';
import { formatCurrency, formatDateTime } from '../lib/utils';
import type { Product, Supplier } from '../types';
import type { Purchase } from '../services/purchases';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';

interface Line {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export default function PurchasesPage() {
  const { appUser } = useAuth();
  const [items, setItems] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', productName: '', quantity: 1, unitCost: 0 }]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, pr, s] = await Promise.all([
        listPurchases().catch(() => []),
        listProducts({ activeOnly: true }),
        listSuppliers().catch(() => []),
      ]);
      setItems(p);
      setProducts(pr);
      setSuppliers(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = lines.reduce((s, l) => s + (l.quantity || 0) * (l.unitCost || 0), 0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setError('');
    const valid = lines.filter((l) => l.productId && l.quantity > 0);
    if (!valid.length) {
      setError('Add at least one product with quantity');
      return;
    }
    const supplier = suppliers.find((s) => s.id === supplierId);
    setSaving(true);
    try {
      await createPurchase({
        supplierId: supplierId || '',
        supplierName: supplier?.name || 'Supplier',
        items: valid.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitCost: l.unitCost,
        })),
        paymentStatus,
        notes: notes.trim() || undefined,
        recordedBy: appUser.uid,
        recordedByName: appUser.displayName || appUser.email,
      });
      setOpen(false);
      setLines([{ productId: '', productName: '', quantity: 1, unitCost: 0 }]);
      setNotes('');
      setSupplierId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Purchases</h1>
          <p className="text-sm text-zinc-500">Record stock received from suppliers</p>
        </div>
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950">
          <Plus className="h-4 w-4" /> Record purchase
        </button>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No purchase records yet. Click <strong>Record purchase</strong> to receive stock from a supplier.
        </p>
      ) : (
        <div className="divide-y rounded-lg border border-zinc-200 bg-white">
          {items.map((p) => (
            <div key={p.id} className="flex justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-900">{p.reference} · {p.supplierName}</p>
                <p className="text-xs text-zinc-500">
                  {p.createdAt ? formatDateTime(p.createdAt) : ''} · {p.paymentStatus} · {(p.items || []).length} item(s)
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(p.total || 0)}</p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setOpen(false)} />
          <form onSubmit={onSubmit} className="relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Record purchase</h3>
              <button type="button" disabled={saving} onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Supplier</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Select supplier (optional)</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Payment status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PARTIAL' | 'UNPAID')} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-600">Items received</p>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg border p-2">
                  <select className="col-span-12 rounded border px-2 py-1.5 text-sm sm:col-span-5" value={line.productId} required
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      setLines((prev) => prev.map((l, i) => i === idx ? { ...l, productId: e.target.value, productName: p?.name || '', unitCost: p?.buyingPrice || l.unitCost } : l));
                    }}>
                    <option value="">Product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min={1} placeholder="Qty" value={line.quantity || ''} required
                    onChange={(e) => setLines((prev) => prev.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) || 0 } : l))}
                    className="col-span-4 rounded border px-2 py-1.5 text-sm sm:col-span-2" />
                  <input type="number" min={0} placeholder="Cost" value={line.unitCost || ''}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => i === idx ? { ...l, unitCost: Number(e.target.value) || 0 } : l))}
                    className="col-span-5 rounded border px-2 py-1.5 text-sm sm:col-span-3" />
                  <button type="button" className="col-span-3 text-xs text-red-600 sm:col-span-2"
                    onClick={() => setLines((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setLines((prev) => [...prev, { productId: '', productName: '', quantity: 1, unitCost: 0 }])} className="text-sm font-medium text-amber-600">+ Add line</button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save purchase & update stock'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
