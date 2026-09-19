import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Boxes, ShoppingCart, AlertTriangle, TrendingUp, Banknote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const metrics = [
    { label: 'Total Products', value: '—', icon: Package },
    { label: 'Stock Units', value: '—', icon: Boxes },
    { label: 'Inventory Cost', value: '—', icon: Banknote },
    { label: 'Retail Value', value: '—', icon: TrendingUp },
    { label: "Today's Sales", value: '—', icon: ShoppingCart },
    { label: "Today's Profit", value: '—', icon: TrendingUp },
    { label: 'Low Stock', value: '—', icon: AlertTriangle },
    { label: 'Out of Stock', value: '—', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Welcome{appUser?.displayName ? `, ${appUser.displayName}` : ''} · A.J Motorbike Spares
        </p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-zinc-200 bg-white p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-zinc-500">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-800 md:text-xl">{m.value}</p>
                </div>
                <m.icon className="h-5 w-5 text-zinc-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
        <p className="font-medium text-zinc-700 mb-1">Connect Firebase to load live data</p>
        <p>Add your Firebase config to <code className="text-xs bg-zinc-100 px-1 rounded">.env</code> then create an admin user document in the <code className="text-xs bg-zinc-100 px-1 rounded">users</code> collection.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/pos" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950">Open POS</Link>
          <Link to="/inventory" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700">Inventory</Link>
        </div>
      </div>
    </div>
  );
}
