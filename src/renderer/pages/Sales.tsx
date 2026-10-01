import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import type { CartItem, Customer, Product, SessionUser, Settings } from '../../shared/types';
import { money, errorMessage } from '../helpers';

export function Sales({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'other'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentReference, setPaymentReference] = useState('');
  const [receipt, setReceipt] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void window.aj.getSettings().then(setSettings);
  }, []);
  useEffect(() => {
    void window.aj.listProducts(query, false).then(setProducts);
  }, [query]);
  useEffect(() => {
    void window.aj.listCustomers(customerQuery).then(setCustomers);
  }, [customerQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) void complete();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0) + orderDiscount;
    const tax = Math.max(0, subtotal - discount) * ((settings?.taxPercentage || 0) / 100);
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, discount, tax, total, change: Math.max(0, paidAmount - total) };
  }, [cart, orderDiscount, paidAmount, settings]);

  function addProduct(product: Product) {
    if (product.stockQuantity <= 0) {
      notify(`No stock for ${product.name}`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stockQuantity) {
          notify(`Insufficient stock for ${product.name}`);
          return current;
        }
        return current.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          taxRate: settings?.taxPercentage || 0
        }
      ];
    });
    setQuery('');
    searchRef.current?.focus();
  }

  function updateQty(productId: number, quantity: number) {
    if (quantity < 1) return;
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stockQuantity) {
      notify(`Insufficient stock. Available: ${product.stockQuantity}`);
      return;
    }
    setCart((c) => c.map((row) => (row.productId === productId ? { ...row, quantity } : row)));
  }

  async function complete() {
    try {
      if (paymentMethod === 'cash' && paidAmount < totals.total) {
        notify('Insufficient payment.');
        return;
      }
      const saleData = await window.aj.completeSale({
        userId: user.id,
        cashierName: user.fullName,
        customerId,
        items: cart,
        orderDiscount,
        taxRate: settings?.taxPercentage || 0,
        paymentMethod,
        paidAmount,
        paymentReference: paymentReference || null
      });
      const text = await window.aj.buildReceipt(saleData);
      setReceipt(text);
      setCart([]);
      setOrderDiscount(0);
      setPaidAmount(0);
      setPaymentReference('');
      setCustomerId(null);
      notify(`Sale completed: ${(saleData as any).sale?.invoiceNumber || 'OK'}`);
      void window.aj.listProducts(query, false).then(setProducts);
    } catch (error) {
      notify(errorMessage(error));
    }
  }

  return (
    <div className="sales-grid">
      <section className="panel">
        <input
          ref={searchRef}
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Scan barcode or search name / SKU"
          autoFocus
        />
        <div className="product-list">
          {products.map((product) => (
            <button key={product.id} onClick={() => addProduct(product)} disabled={product.stockQuantity <= 0}>
              <strong>{product.name}</strong>
              <span>{product.sku}</span>
              <b>{money(product.sellingPrice, settings?.currency)}</b>
              <small>
                Stock {product.stockQuantity}
                {product.categoryName ? ` · ${product.categoryName}` : ''}
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel cart">
        <h2>Cart</h2>
        <label>
          Customer (optional)
          <input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Search customer" />
        </label>
        <select value={customerId ?? ''} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Walk-in</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.phone ? ` (${c.phone})` : ''}
            </option>
          ))}
        </select>
        {cart.map((item) => (
          <div className="cart-row" key={item.productId}>
            <strong>{item.name}</strong>
            <input type="number" min={1} value={item.quantity} onChange={(e) => updateQty(item.productId, Number(e.target.value))} />
            <input
              type="number"
              min={0}
              value={item.discount}
              onChange={(e) => setCart(cart.map((row) => (row.productId === item.productId ? { ...row, discount: Number(e.target.value) } : row)))}
              title="Line discount"
            />
            <span>{money(item.quantity * item.unitPrice - item.discount, settings?.currency)}</span>
            <button className="danger" onClick={() => setCart(cart.filter((row) => row.productId !== item.productId))}>
              Remove
            </button>
          </div>
        ))}
        <label>
          Order discount
          <input type="number" min={0} value={orderDiscount} onChange={(e) => setOrderDiscount(Number(e.target.value))} />
        </label>
        <div className="totals">
          <span>Subtotal <b>{money(totals.subtotal, settings?.currency)}</b></span>
          <span>Discount <b>{money(totals.discount, settings?.currency)}</b></span>
          <span>Tax <b>{money(totals.tax, settings?.currency)}</b></span>
          <span className="grand">TOTAL <b>{money(totals.total, settings?.currency)}</b></span>
        </div>
        <div className="segmented">
          {(['cash', 'mpesa', 'card', 'other'] as const).map((method) => (
            <button key={method} className={paymentMethod === method ? 'selected' : ''} onClick={() => setPaymentMethod(method)}>
              {method.toUpperCase()}
            </button>
          ))}
        </div>
        {(paymentMethod === 'mpesa' || paymentMethod === 'card') && (
          <label>
            Reference
            <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="M-Pesa / card ref" />
          </label>
        )}
        <label>
          Amount tendered
          <input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
        </label>
        <div className="change">Change {money(totals.change, settings?.currency)}</div>
        <button className="primary large" disabled={cart.length === 0} onClick={complete}>
          Complete sale (F8)
        </button>
        {receipt && (
          <div className="receipt">
            <button onClick={() => window.aj.printReceipt(receipt)}>
              <Printer size={18} /> Print receipt
            </button>
            <pre>{receipt}</pre>
          </div>
        )}
      </section>
    </div>
  );
}
