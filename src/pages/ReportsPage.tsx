import { useEffect, useState } from 'react';
import { listSales } from '../services/sales';
import { getInventoryStats } from '../services/products';
import { listExpenses } from '../services/expenses';
import { formatCurrency } from '../lib/utils';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    revenue: 0, profit: 0, salesCount: 0, expenses: 0, retailValue: 0,
    cash: 0, mpesa: 0, card: 0, other: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [sales, inv, expenses] = await Promise.all([
          listSales(500),
          getInventoryStats(),
          listExpenses().catch(() => []),
        ]);
        const completed = sales.filter((s) => s.status === 'COMPLETED');
        let revenue = 0, profit = 0, cash = 0, mpesa = 0, card = 0, other = 0;
        for (const s of completed) {
          revenue += s.total;
          profit += s.profit;
          const m = (s.paymentMethod || 'OTHER').toUpperCase();
          if (m === 'CASH') cash += s.total;
          else if (m === 'MPESA') mpesa += s.total;
          else if (m === 'CARD') card += s.total;
          else other += s.total;
        }
        setData({
          revenue, profit, salesCount: completed.length,
          expenses: expenses.reduce((a, e) => a + (e.amount || 0), 0),
          retailValue: inv.retailValue, cash, mpesa, card, other,
        });
      } catch (e) {
        console.error(e);
        setError('Could not load reports. Add sales first.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-zinc-100" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500">Business analysis · A.J Motorbike Spares</p>
      </div>
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Total revenue</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(data.revenue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Gross profit</p>
          <p className="text-xl font-bold tabular-nums text-emerald-700">{formatCurrency(data.profit)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Sales count</p>
          <p className="text-xl font-bold tabular-nums">{data.salesCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Expenses</p>
          <p className="text-xl font-bold tabular-nums text-red-700">{formatCurrency(data.expenses)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Net (gross − expenses)</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(data.profit - data.expenses)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Inventory retail value</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(data.retailValue)}</p>
        </div>
      </div>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Sales by payment method</h2>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-zinc-500">Cash</p><p className="font-semibold tabular-nums">{formatCurrency(data.cash)}</p></div>
          <div><p className="text-zinc-500">M-Pesa</p><p className="font-semibold tabular-nums">{formatCurrency(data.mpesa)}</p></div>
          <div><p className="text-xs text-zinc-500">Card</p><p className="font-semibold tabular-nums">{formatCurrency(data.card)}</p></div>
          <div><p className="text-zinc-500">Other</p><p className="font-semibold tabular-nums">{formatCurrency(data.other)}</p></div>
        </div>
      </section>
    </div>
  );
}
