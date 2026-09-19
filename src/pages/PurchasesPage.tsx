import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency, formatDateTime } from '../lib/utils';

interface PurchaseRow {
  id: string;
  reference?: string;
  supplierName?: string;
  total?: number;
  paymentStatus?: string;
  createdAt?: string;
}

export default function PurchasesPage() {
  const [items, setItems] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(100)))
      .then((snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PurchaseRow))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Purchases</h1>
        <p className="text-sm text-zinc-500">
          Supplier purchases. To receive stock now: Inventory → Add Product (with opening qty) or adjust stock on a product.
        </p>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No purchase records yet. Add products with opening quantity to build stock.
        </p>
      ) : (
        <div className="divide-y rounded-lg border border-zinc-200 bg-white">
          {items.map((p) => (
            <div key={p.id} className="flex justify-between px-4 py-3">
              <div>
                <p className="font-medium">{p.reference || p.id.slice(0, 8)} · {p.supplierName || '—'}</p>
                <p className="text-xs text-zinc-500">
                  {p.createdAt ? formatDateTime(p.createdAt) : ''} · {p.paymentStatus || ''}
                </p>
              </div>
              <p className="font-semibold tabular-nums">{formatCurrency(p.total || 0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
