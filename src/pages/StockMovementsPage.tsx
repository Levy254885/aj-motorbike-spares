import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDateTime } from '../lib/utils';
import type { StockMovement } from '../types';

export default function StockMovementsPage() {
  const [items, setItems] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    getDocs(query(collection(db, 'stockMovements'), orderBy('createdAt', 'desc'), limit(100)))
      .then((snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement))))
      .catch((e) => {
        console.error(e);
        setError('Could not load stock movements. If Firestore asks for an index, create it from the console link.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Stock movements</h1>
        <p className="text-sm text-zinc-500">Sales, receiving, and adjustments appear here.</p>
      </div>
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No movements yet. Add a product or complete a sale to see activity here.
        </p>
      ) : (
        <div className="divide-y rounded-lg border border-zinc-200 bg-white">
          {items.map((m) => (
            <div key={m.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{m.productName} · {m.type}</p>
              <p className="text-xs text-zinc-500">
                {m.previousQuantity} → {m.newQuantity}
                {m.userName ? ` · ${m.userName}` : ''}
                {m.createdAt ? ` · ${formatDateTime(m.createdAt)}` : ''}
                {m.reason ? ` · ${m.reason}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
