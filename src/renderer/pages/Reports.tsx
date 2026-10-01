import React, { useEffect, useState } from 'react';
import type { ReportRow, Settings } from '../../shared/types';
import { Table } from '../components/ui';

export function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [title, setTitle] = useState('Daily sales report');
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void window.aj.getSettings().then(setSettings);
  }, []);
  async function run(kind: string) {
    const map: Record<string, () => Promise<ReportRow[]>> = {
      sales: () => window.aj.salesReport(from, to),
      products: () => window.aj.productSalesReport(from, to),
      cashiers: () => window.aj.cashierReport(from, to),
      profit: () => window.aj.profitReport(from, to),
      inventory: () => window.aj.inventoryReport(false),
      low: () => window.aj.inventoryReport(true)
    };
    setTitle(kind);
    setRows(await map[kind]());
  }
  return (
    <section>
      <div className="panel toolbar">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        {['sales', 'products', 'cashiers', 'profit', 'inventory', 'low'].map((kind) => (
          <button key={kind} onClick={() => run(kind)}>
            {kind}
          </button>
        ))}
        <button onClick={() => window.aj.saveCsv(rows)}>CSV</button>
        <button onClick={() => window.aj.savePdf(title, rows)}>PDF</button>
      </div>
      <div className="panel">
        <h2>{title}</h2>
        <Table rows={rows} currency={settings?.currency} />
      </div>
    </section>
  );
}
