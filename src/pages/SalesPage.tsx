import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSales } from '../services/sales';
import { formatCurrency, formatDateTime } from '../lib/utils';
import type { Sale } from '../types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listSales(150)
      .then(setSales)
      .catch((e) => { console.error(e); setError('Could not load sales'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">Sales</h1>
        <p className="text-sm text-zinc-500">Transaction history</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-100" />)}</div>
      ) : sales.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No sales yet. Complete a sale from POS.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {sales.map((s) => (
            <Link key={s.id} to={`/sales/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{s.receiptNumber} · {s.customerName}</p>
                <p className="text-xs text-zinc-500">{formatDateTime(s.createdAt)} · {s.paymentMethod} · {s.cashierName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(s.total)}</p>
                <p className="text-xs tabular-nums text-emerald-600">+{formatCurrency(s.profit)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
