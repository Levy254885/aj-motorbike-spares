import React, { useEffect, useState } from 'react';
import type { Product, SessionUser } from '../../shared/types';
import { errorMessage } from '../helpers';
import { Table } from '../components/ui';

export function Inventory({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: 0, type: 'stock_in', quantity: 1, reason: 'Manual adjustment' });
  const refresh = () =>
    Promise.all([window.aj.listProducts('', true).then(setProducts), window.aj.inventoryHistory().then(setHistory)]);
  useEffect(() => {
    void refresh();
  }, []);
  async function save() {
    try {
      await window.aj.adjustStock({ ...form, productId: Number(form.productId), quantity: Number(form.quantity) }, user.id);
      await refresh();
      notify('Stock updated.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section>
      <div className="panel form-grid">
        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: Number(e.target.value) })}>
          <option value={0}>Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (stock {p.stockQuantity})
            </option>
          ))}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="stock_in">Stock in</option>
          <option value="stock_out">Stock out</option>
          <option value="adjustment">Set stock</option>
        </select>
        <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button className="primary" onClick={save}>
          Apply
        </button>
      </div>
      <div className="panel">
        <h2>Stock history</h2>
        <Table rows={history} />
      </div>
    </section>
  );
}
