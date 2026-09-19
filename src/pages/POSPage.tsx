import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react';
import { searchProductsPOS } from '../services/products';
import { completeSale } from '../services/sales';
import { formatCurrency, getStockStatus, stockStatusColor } from '../lib/utils';
import type { CartItem, PaymentMethod, Product, Sale } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function POSPage() {
  const { appUser } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discount, setDiscount] = useState(0);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await searchProductsPOS(search));
    } catch (e) {
      console.error(e);
      setError('Could not load products. Add products in Inventory first.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id !== productId ? c : { ...c, quantity: Math.max(0, Math.min(qty, c.product.quantity)) }))
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.product.sellingPrice * c.quantity, 0);
  const total = Math.max(0, subtotal - (discount || 0));
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handleCheckout = async () => {
    if (!appUser || !cart.length || processing) return;
    if (paymentMethod === 'MPESA' && !paymentRef.trim()) {
      setError('Enter M-Pesa reference number');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const sale = await completeSale({
        items: cart,
        customerName: customerName.trim() || 'Walk-in Customer',
        paymentMethod,
        paymentReference: paymentRef.trim() || undefined,
        discount: discount || 0,
        cashierId: appUser.uid,
        cashierName: appUser.displayName || appUser.email,
      });
      setCompletedSale(sale);
      setCart([]);
      setCheckoutOpen(false);
      setMobileCartOpen(false);
      setDiscount(0);
      setPaymentRef('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (completedSale) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="font-semibold text-emerald-800">Sale completed</p>
          <p className="mt-1 text-sm text-emerald-700">{completedSale.receiptNumber}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-center font-bold">A.J MOTORBIKE SPARES & ACCESSORIES</h2>
          <p className="text-center text-xs text-zinc-500 mt-1">{completedSale.receiptNumber}</p>
          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            {completedSale.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>{item.productName} × {item.quantity}</span>
                <span className="tabular-nums">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(completedSale.total)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Payment</span>
              <span>{completedSale.paymentMethod}{completedSale.paymentReference ? ` · ${completedSale.paymentReference}` : ''}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-zinc-500">Thank you for shopping with A.J Motorbike Spares.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="flex-1 rounded-lg border py-2.5 text-sm font-medium">Print</button>
          <button type="button" onClick={() => setCompletedSale(null)} className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950">New sale</button>
        </div>
      </div>
    );
  }

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="font-semibold">Cart ({itemCount})</h2>
        {cart.length > 0 && <button type="button" onClick={() => setCart([])} className="text-xs text-red-600">Clear</button>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Cart is empty</p>
        ) : (
          cart.map((c) => (
            <div key={c.product.id} className="rounded-lg border p-2">
              <div className="flex justify-between gap-2">
                <p className="line-clamp-2 text-sm font-medium">{c.product.name}</p>
                <button type="button" onClick={() => updateQty(c.product.id, 0)}><Trash2 className="h-4 w-4 text-zinc-400" /></button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => updateQty(c.product.id, c.quantity - 1)} className="rounded border p-1"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm">{c.quantity}</span>
                  <button type="button" onClick={() => updateQty(c.product.id, c.quantity + 1)} className="rounded border p-1"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(c.product.sellingPrice * c.quantity)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2 border-t p-3">
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
        <button type="button" disabled={!cart.length} onClick={() => { setError(''); setCheckoutOpen(true); }}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50">
          Checkout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-zinc-900">Point of Sale</h1>
        <button type="button" onClick={() => setMobileCartOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 md:hidden">
          <ShoppingCart className="h-4 w-4" /> {itemCount} · {formatCurrency(total)}
        </button>
      </div>
      {error && !checkoutOpen && <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU, brand…"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-100" />)}
              </div>
            ) : products.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">No products. Go to Inventory → Add Product first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => {
                  const status = getStockStatus(p.quantity, p.minimumStockLevel);
                  const out = p.quantity <= 0;
                  return (
                    <button key={p.id} type="button" disabled={out} onClick={() => addToCart(p)}
                      className="rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
                      <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{p.sku}</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatCurrency(p.sellingPrice)}</p>
                      <span className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${stockStatusColor(status)}`}>
                        {out ? 'OUT OF STOCK' : `Stock ${p.quantity}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="hidden w-80 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white md:block">{cartPanel}</div>
      </div>
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-xl bg-white">{cartPanel}</div>
        </div>
      )}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processing && setCheckoutOpen(false)} />
          <div className="relative w-full max-w-md space-y-3 rounded-t-xl bg-white p-4 shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Checkout</h3>
              <button type="button" disabled={processing} onClick={() => setCheckoutOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Customer</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Payment</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="CASH">Cash</option>
                <option value="MPESA">M-Pesa</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            {paymentMethod === 'MPESA' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">M-Pesa reference</label>
                <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="QH7X..." />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Discount (KSh)</label>
              <input type="number" min={0} value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <button type="button" disabled={processing} onClick={handleCheckout}
              className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60">
              {processing ? 'Processing…' : 'Complete sale'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
