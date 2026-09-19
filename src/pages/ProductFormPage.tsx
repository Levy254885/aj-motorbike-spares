import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProduct, updateProduct } from '../services/products';
import { formatCurrency, profitMargin } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['Engine Parts','Brake System','Electrical','Suspension','Chains & Sprockets','Cables','Bearings','Tyres','Tubes','Body Parts','Fuel System','Clutch','Filters','Lubricants','Accessories','Helmets','Lighting','Mirrors','Other'];
const BRANDS = ['Bajaj','TVS','Honda','Yamaha','Boxer','Generic','Other'];

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', sku: '', categoryId: 'Other', brand: 'Generic', compatibleModels: '',
    description: '', buyingPrice: 0, sellingPrice: 0, quantity: 0, minimumStockLevel: 5, shelfLocation: '',
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    getProduct(id).then((p) => {
      if (!p) return;
      setForm({
        name: p.name, sku: p.sku, categoryId: p.categoryId || 'Other', brand: p.brand || 'Generic',
        compatibleModels: (p.compatibleModels || []).join(', '), description: p.description || '',
        buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice, quantity: p.quantity,
        minimumStockLevel: p.minimumStockLevel, shelfLocation: p.shelfLocation || '',
      });
    });
  }, [id, isEdit]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        categoryId: form.categoryId,
        categoryName: form.categoryId,
        brand: form.brand,
        compatibleModels: form.compatibleModels.split(',').map((s) => s.trim()).filter(Boolean),
        description: form.description.trim() || undefined,
        buyingPrice: Number(form.buyingPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        quantity: Number(form.quantity) || 0,
        minimumStockLevel: Number(form.minimumStockLevel) || 0,
        shelfLocation: form.shelfLocation.trim() || undefined,
        active: true,
        createdBy: appUser.uid,
      };
      if (!payload.name || !payload.sku) throw new Error('Name and SKU are required');
      if (isEdit && id) {
        const { quantity: _q, createdBy: _c, ...rest } = payload;
        await updateProduct(id, rest);
        navigate(`/inventory/${id}`);
      } else {
        const newId = await createProduct(payload);
        navigate(`/inventory/${newId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const unitProfit = form.sellingPrice - form.buyingPrice;
  const margin = profitMargin(form.buyingPrice, form.sellingPrice);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">{isEdit ? 'Edit product' : 'Add product'}</h1>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-600">Product name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Brake Pad — Boxer 125" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">SKU *</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border px-3 py-2 font-mono text-sm" placeholder="AJ-BRK-001" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Brand</label>
            <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Shelf / location</label>
            <input value={form.shelfLocation} onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-600">Compatible motorcycles (comma-separated)</label>
            <input value={form.compatibleModels} onChange={(e) => setForm({ ...form, compatibleModels: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Boxer 100, Boxer 125" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Cost (KSh)</label>
            <input type="number" min={0} value={form.buyingPrice || ''} onChange={(e) => setForm({ ...form, buyingPrice: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Selling (KSh)</label>
            <input type="number" min={0} value={form.sellingPrice || ''} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          {!isEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Opening quantity</label>
              <input type="number" min={0} value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Minimum stock</label>
            <input type="number" min={0} value={form.minimumStockLevel || ''} onChange={(e) => setForm({ ...form, minimumStockLevel: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
          Profit/unit: <strong>{formatCurrency(unitProfit)}</strong> · Margin: <strong>{margin.toFixed(1)}%</strong>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 rounded-lg border py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60">
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  );
}
