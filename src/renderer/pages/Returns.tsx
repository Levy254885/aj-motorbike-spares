import React, { useEffect, useState } from 'react';
import type { SessionUser } from '../../shared/types';
import { errorMessage, money } from '../helpers';
import { Table } from '../components/ui';

export function Returns({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState('Customer return');
  useEffect(() => {
    if (query) void window.aj.searchSales(query).then(setSales);
  }, [query]);
  async function load(id: number) {
    setSelected(await window.aj.getSale(id));
  }
  async function refund() {
    if (!selected || !window.confirm('Record refund and restore stock?')) return;
    try {
      await window.aj.createReturn({
        saleId: selected.sale.id,
        userId: user.id,
        reason,
        items: selected.items.map((item: any) => ({ saleItemId: item.id, quantity: item.quantity }))
      });
      notify('Refund recorded.');
      setSelected(null);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section className="panel">
      <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice number" />
      <Table rows={sales} action={(row) => <button onClick={() => load(row.id)}>Open</button>} />
      {selected && (
        <div className="refund">
          <h2>{selected.sale.invoiceNumber}</h2>
          <Table rows={selected.items} />
          <label>
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button className="danger large" onClick={refund}>
            Refund full sale
          </button>
        </div>
      )}
    </section>
  );
}
