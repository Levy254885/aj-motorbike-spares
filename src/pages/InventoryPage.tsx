import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package } from 'lucide-react';
import { listProducts } from '../services/products';
import { formatCurrency, getStockStatus, stockStatusColor } from '../lib/utils';
import type { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/common/EmptyState';

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listProducts({
        search: search || undefined,
        status: statusFilter || undefined,
        activeOnly: true,
      });
      setProducts(list);
    } catch (e) {
      console.error(e);
      setError('Could not load products. Check Firestore rules and indexes.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const canManage = hasRole('ADMIN', 'MANAGER', 'STOREKEEPER');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">Inventory</h1>
          <p className="text-sm text-zinc-500">{products.length} products</p>
        </div>
        {canManage && (
          <Link to="/inventory/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="search" placeholder="Search name, SKU, brand, motorcycle…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm">
          <option value="">All status</option>
          <option value="HEALTHY">Healthy</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100" />)}</div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No products yet"
          description="Add your first motorcycle spare part to begin managing inventory."
          action={canManage ? (
            <Link to="/inventory/new" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950">
              <Plus className="h-4 w-4" /> Add Product
            </Link>
          ) : undefined}
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {products.map((p) => {
              const status = getStockStatus(p.quantity, p.minimumStockLevel);
              return (
                <Link key={p.id} to={`/inventory/${p.id}`} className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                    <Package className="h-6 w-6 text-zinc-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-500">SKU: {p.sku}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(p.sellingPrice)}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${stockStatusColor(status)}`}>
                        {status.replace('_', ' ')} · {p.quantity}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Selling</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p) => {
                  const status = getStockStatus(p.quantity, p.minimumStockLevel);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.sku}</td>
                      <td className="px-4 py-3 text-zinc-600">{p.brand || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.buyingPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${stockStatusColor(status)}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/inventory/${p.id}`} className="font-medium text-amber-600">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
