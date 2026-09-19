import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Banknote,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DashStats {
  totalProducts: number;
  totalUnits: number;
  costValue: number;
  retailValue: number;
  todayRevenue: number;
  todayProfit: number;
  todayCount: number;
  lowStock: number;
  outOfStock: number;
  weekRevenue: number;
  monthRevenue: number;
}

interface RecentSale {
  id: string;
  receiptNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  cashierName: string;
  createdAt: string;
  profit?: number;
}

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [stats, setStats] = useState<DashStats>({
    totalProducts: 0,
    totalUnits: 0,
    costValue: 0,
    retailValue: 0,
    todayRevenue: 0,
    todayProfit: 0,
    todayCount: 0,
    lowStock: 0,
    outOfStock: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const productsSnap = await getDocs(
          query(collection(db, 'products'), where('active', '==', true))
        );
        let totalUnits = 0;
        let costValue = 0;
        let retailValue = 0;
        let lowStock = 0;
        let outOfStock = 0;
        productsSnap.docs.forEach((d) => {
          const p = d.data();
          const qty = Number(p.quantity) || 0;
          const cost = Number(p.buyingPrice) || 0;
          const sell = Number(p.sellingPrice) || 0;
          const min = Number(p.minimumStockLevel) || 0;
          totalUnits += qty;
          costValue += qty * cost;
          retailValue += qty * sell;
          if (qty <= 0) outOfStock++;
          else if (qty <= min) lowStock++;
        });

        const salesSnap = await getDocs(
          query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(500))
        );
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayRevenue = 0;
        let todayProfit = 0;
        let todayCount = 0;
        let weekRevenue = 0;
        let monthRevenue = 0;
        const payments: Record<string, number> = {};
        const recent: RecentSale[] = [];

        salesSnap.docs.forEach((d, idx) => {
          const s = d.data();
          if (s.status && s.status !== 'COMPLETED') return;
          const created = s.createdAt || '';
          const total = Number(s.total) || 0;
          const profit = Number(s.profit) || 0;
          const method = (s.paymentMethod || 'OTHER') as string;

          if (created >= startOfToday.toISOString()) {
            todayRevenue += total;
            todayProfit += profit;
            todayCount++;
          }
          if (created >= startOfWeek.toISOString()) {
            weekRevenue += total;
          }
          if (created >= startOfMonth.toISOString()) {
            monthRevenue += total;
            payments[method] = (payments[method] || 0) + total;
          }

          if (idx < 10) {
            recent.push({
              id: d.id,
              receiptNumber: s.receiptNumber || d.id.slice(0, 8),
              customerName: s.customerName || 'Walk-in',
              total,
              paymentMethod: method,
              cashierName: s.cashierName || '—',
              createdAt: created,
              profit,
            });
          }
        });

        if (!cancelled) {
          setStats({
            totalProducts: productsSnap.size,
            totalUnits,
            costValue,
            retailValue,
            todayRevenue,
            todayProfit,
            todayCount,
            lowStock,
            outOfStock,
            weekRevenue,
            monthRevenue,
          });
          setRecentSales(recent);
          setPaymentBreakdown(payments);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            'Could not load dashboard data. Check Firestore rules and that collections exist.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = [
    { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-zinc-800' },
    { label: 'Stock Units', value: stats.totalUnits.toLocaleString(), icon: Boxes, color: 'text-zinc-800' },
    { label: 'Inventory Cost', value: formatCurrency(stats.costValue), icon: Banknote, color: 'text-zinc-800' },
    { label: 'Retail Value', value: formatCurrency(stats.retailValue), icon: TrendingUp, color: 'text-emerald-700' },
    { label: "Today's Sales", value: formatCurrency(stats.todayRevenue), sub: `${stats.todayCount} transactions`, icon: ShoppingCart, color: 'text-amber-700' },
    { label: "Today's Profit", value: formatCurrency(stats.todayProfit), icon: TrendingUp, color: 'text-emerald-700' },
    { label: 'Low Stock', value: String(stats.lowStock), icon: AlertTriangle, color: 'text-amber-700' },
    { label: 'Out of Stock', value: String(stats.outOfStock), icon: AlertTriangle, color: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          A.J Motorbike Spares & Accessories · Single shop
          {appUser?.displayName ? ` · ${appUser.displayName}` : ''}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-zinc-200 bg-white p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500 truncate">{m.label}</p>
                    <p className={`mt-1 text-lg font-bold tabular-nums md:text-xl ${m.color}`}>{m.value}</p>
                    {m.sub && <p className="text-xs text-zinc-400 mt-0.5">{m.sub}</p>}
                  </div>
                  <m.icon className="h-5 w-5 text-zinc-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-zinc-900">Sales analysis</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">Today</p>
                <p className="text-xl font-bold text-zinc-900 tabular-nums">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stats.todayCount} sales · Profit {formatCurrency(stats.todayProfit)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">Last 7 days</p>
                <p className="text-xl font-bold text-zinc-900 tabular-nums">{formatCurrency(stats.weekRevenue)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">This month</p>
                <p className="text-xl font-bold text-zinc-900 tabular-nums">{formatCurrency(stats.monthRevenue)}</p>
              </div>
            </div>

            {Object.keys(paymentBreakdown).length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 mb-2">This month by payment method</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <span
                      key={method}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm"
                    >
                      <span className="font-medium text-zinc-700">{method}</span>
                      <span className="tabular-nums text-zinc-900 font-semibold">{formatCurrency(amount)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <h2 className="font-semibold text-zinc-900">Recent sales</h2>
                <Link to="/sales" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {recentSales.length === 0 ? (
                  <p className="p-6 text-center text-sm text-zinc-500">
                    No sales yet. Use POS to record the first sale.
                  </p>
                ) : (
                  recentSales.map((s) => (
                    <Link
                      key={s.id}
                      to={`/sales/${s.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {s.receiptNumber} · {s.customerName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {s.paymentMethod} · {s.cashierName}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 tabular-nums shrink-0">
                        {formatCurrency(s.total)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
              <h2 className="font-semibold text-zinc-900 mb-3">Inventory valuation</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cost value</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(stats.costValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Retail value</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(stats.retailValue)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-3">
                  <span className="text-zinc-500">Potential gross profit</span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(stats.retailValue - stats.costValue)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Potential profit assumes all current stock sells at current selling prices.
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
