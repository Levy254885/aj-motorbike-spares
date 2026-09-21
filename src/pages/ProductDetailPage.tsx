import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, adjustStock } from '../services/products';
import { formatCurrency, formatDateTime, getStockStatus, stockStatusColor } from '../lib/utils';
import type { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { appUser, hasRole } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const p = await getProduct(id);
      setProduct(p);
      if (p) setNewQty(p.quantity);
    } catch (e) {
      console.error(e);
      setError('Could not load product.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const canManage = hasRole('ADMIN', 'MANAGER', 'STOREKEEPER');

  const doAdjust = async () => {
    if (!product || !appUser || !reason.trim()) {
      setError('Reason is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adjustStock(
        product.id,
        newQty,
        reason.trim(),
        appUser.uid,
        appUser.displayName || appUser.email
      );
      setAdjustOpen(false);
      setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (!product) {
    return (
      <div className="space-y-3">
        <p className="text-zinc-600">Product not found.</p>
        <Link to="/inventory" className="text-sm font-medium text-amber-600">
          ← Back to inventory
        </Link>
      </div>
    );
  }

  const status = getStockStatus(product.quantity, product.minimumStockLevel);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to="/inventory" className="text-xs font-medium text-amber-600">
            ← Inventory
          </Link>
          <h1 className="mt-1 text-xl font-bold text-zinc-900">{product.name}</h1>
          <p className="font-mono text-sm text-zinc-500">{product.sku}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustOpen(true);
                setNewQty(product.quantity);
                setError('');
              }}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
            >
              Adjust stock
            </button>
            <Link
              to={`/inventory/${product.id}/edit`}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950"
            >
              Edit
            </Link>
          </div>
        )}
      </div>

      {error && !adjustOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Status</span>
          <span
            className={`rounded border px-2 py-0.5 text-xs font-medium ${stockStatusColor(status)}`}
          >
            {status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Stock on hand</span>
          <span className="font-semibold tabular-nums">{product.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Minimum stock</span>
          <span className="tabular-nums">{product.minimumStockLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Cost price</span>
          <span className="tabular-nums">{formatCurrency(product.buyingPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Selling price</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(product.sellingPrice)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Profit / unit</span>
          <span className="tabular-nums text-emerald-700">
            {formatCurrency(product.sellingPrice - product.buyingPrice)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Brand</span>
          <span>{product.brand || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Category</span>
          <span>{product.categoryName || product.categoryId || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Location</span>
          <span>{product.shelfLocation || '—'}</span>
        </div>
        {product.compatibleModels && product.compatibleModels.length > 0 && (
          <div>
            <p className="mb-1 text-zinc-500">Compatible motorcycles</p>
            <p className="text-zinc-900">{product.compatibleModels.join(', ')}</p>
          </div>
        )}
        {product.description ? (
          <p className="border-t border-zinc-100 pt-3 text-zinc-600">{product.description}</p>
        ) : null}
        <p className="border-t border-zinc-100 pt-2 text-xs text-zinc-400">
          Updated {formatDateTime(product.updatedAt)}
        </p>
      </div>

      {adjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !saving && setAdjustOpen(false)}
          />
          <div className="relative w-full max-w-sm space-y-3 rounded-xl bg-white p-4">
            <h3 className="font-semibold text-zinc-900">Stock adjustment</h3>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-zinc-500">Current quantity: {product.quantity}</p>
            <div>
              <label className="text-xs font-medium text-zinc-600">New quantity</label>
              <input
                type="number"
                min={0}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Reason *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Physical count / Damaged / Missing"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setAdjustOpen(false)}
                className="flex-1 rounded-lg border py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={doAdjust}
                className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
