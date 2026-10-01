import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArchiveRestore,
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  RotateCcw,
  Settings as SettingsIcon,
  ShoppingCart,
  Tags,
  Users,
  UserCircle
} from 'lucide-react';
import type { Category, Product, ReportRow, SessionUser, Settings } from '../shared/types';
import { money, formatCell, errorMessage, normalizeProduct } from './helpers';
import { Sales } from './pages/Sales';
import './styles/app.css';

type View =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'returns'
  | 'reports'
  | 'settings'
  | 'users'
  | 'backup';

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, admin: false },
  { id: 'sales', label: 'POS', icon: ShoppingCart, admin: false },
  { id: 'products', label: 'Products', icon: PackagePlus, admin: true },
  { id: 'categories', label: 'Categories', icon: Tags, admin: true },
  { id: 'inventory', label: 'Inventory', icon: Boxes, admin: true },
  { id: 'customers', label: 'Customers', icon: UserCircle, admin: false },
  { id: 'returns', label: 'Returns', icon: RotateCcw, admin: false },
  { id: 'reports', label: 'Reports', icon: BarChart3, admin: true },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, admin: true },
  { id: 'users', label: 'Users', icon: Users, admin: true },
  { id: 'backup', label: 'Backup', icon: ArchiveRestore, admin: true }
] as const;

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Table({ rows, action, currency }: { rows: any[]; action?: (row: any) => React.ReactNode; currency?: string }) {
  if (!rows.length) return <div className="empty">No records</div>;
  const headers = Object.keys(rows[0]).slice(0, 8);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
            {action && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {headers.map((h) => (
                <td key={h}>{formatCell(h, row[h], currency)}</td>
              ))}
              {action && <td className="actions">{action(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Login({ onLogin, notify }: { onLogin: (user: SessionUser) => void; notify: (message: string) => void }) {
  const [username, setUsername] = useState('admin');
  const [secret, setSecret] = useState('admin123');
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      onLogin(await window.aj.login({ username, secret, mode }));
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1>AJ Motorbike Spares</h1>
        <p className="hint">Offline POS & Inventory</p>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </label>
        <label>
          {mode === 'pin' ? 'PIN' : 'Password'}
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </label>
        <div className="segmented">
          <button type="button" className={mode === 'password' ? 'selected' : ''} onClick={() => setMode('password')}>
            Password
          </button>
          <button type="button" className={mode === 'pin' ? 'selected' : ''} onClick={() => setMode('pin')}>
            PIN
          </button>
        </div>
        <button className="primary" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="hint">Admin: admin / admin123 · Cashier: cashier / cashier123</p>
      </form>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<any>();
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void Promise.all([window.aj.dashboard(), window.aj.getSettings()]).then(([dashboardData, appSettings]) => {
      setData(dashboardData);
      setSettings(appSettings);
    });
  }, []);
  return (
    <section>
      <div className="stats">
        <Stat label="Today's sales" value={money(data?.todaySales || 0, settings?.currency)} />
        <Stat label="Transactions" value={data?.totalOrders || 0} />
        <Stat label="Low stock" value={data?.lowStockItems || 0} />
        <Stat label="Products in stock" value={data?.productsInStock || 0} />
      </div>
      <div className="stats">
        <Stat label="Cash in drawer" value={money(data?.cashInDrawer || 0, settings?.currency)} />
        <Stat label="Inventory value" value={money(data?.inventoryValue || 0, settings?.currency)} />
      </div>
      <div className="panel">
        <h2>Recent transactions</h2>
        <Table rows={data?.quick || []} currency={settings?.currency} />
      </div>
      <div className="panel">
        <h2>Top selling today</h2>
        <Table rows={data?.topProducts || []} currency={settings?.currency} />
      </div>
    </section>
  );
}

function Products({ user, notify }: { user: SessionUser; notify: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>({});
  const refresh = () =>
    Promise.all([window.aj.listProducts('', true).then(setProducts), window.aj.listCategories().then(setCategories)]);
  useEffect(() => {
    void refresh();
  }, []);
  async function save() {
    try {
      await window.aj.saveProduct(normalizeProduct(editing), user.id);
      setEditing({});
      await refresh();
      notify('Product saved.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section>
      <div className="panel form-grid">
        <label>Name<input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
        <label>SKU<input value={editing.sku || ''} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} /></label>
        <label>Barcode<input value={editing.barcode || ''} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} /></label>
        <label>
          Category
          <select value={editing.categoryId ?? ''} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>Buy price<input type="number" value={editing.purchasePrice ?? 0} onChange={(e) => setEditing({ ...editing, purchasePrice: Number(e.target.value) })} /></label>
        <label>Sell price<input type="number" value={editing.sellingPrice ?? 0} onChange={(e) => setEditing({ ...editing, sellingPrice: Number(e.target.value) })} /></label>
        <label>Stock<input type="number" value={editing.stockQuantity ?? 0} onChange={(e) => setEditing({ ...editing, stockQuantity: Number(e.target.value) })} /></label>
        <label>Low threshold<input type="number" value={editing.lowStockThreshold ?? 5} onChange={(e) => setEditing({ ...editing, lowStockThreshold: Number(e.target.value) })} /></label>
        <button className="primary" onClick={save}>Save product</button>
      </div>
      <div className="panel">
        <Table rows={products} action={(row) => <button onClick={() => setEditing(row)}>Edit</button>} />
      </div>
    </section>
  );
}

function Inventory({ user, notify }: { user: SessionUser; notify: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: 0, type: 'stock_in', quantity: 1, reason: 'Manual adjustment' });
  const refresh = () => Promise.all([window.aj.listProducts('', true).then(setProducts), window.aj.inventoryHistory().then(setHistory)]);
  useEffect(() => { void refresh(); }, []);
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
            <option key={p.id} value={p.id}>{p.name} (stock {p.stockQuantity})</option>
          ))}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="stock_in">Stock in</option>
          <option value="stock_out">Stock out</option>
          <option value="adjustment">Set stock</option>
        </select>
        <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button className="primary" onClick={save}>Apply</button>
      </div>
      <div className="panel"><h2>Stock history</h2><Table rows={history} /></div>
    </section>
  );
}

function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [title, setTitle] = useState('Daily sales report');
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => { void window.aj.getSettings().then(setSettings); }, []);
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
          <button key={kind} onClick={() => run(kind)}>{kind}</button>
        ))}
        <button onClick={() => window.aj.saveCsv(rows)}>CSV</button>
        <button onClick={() => window.aj.savePdf(title, rows)}>PDF</button>
      </div>
      <div className="panel"><h2>{title}</h2><Table rows={rows} currency={settings?.currency} /></div>
    </section>
  );
}

function Backup({ user, notify }: { user: SessionUser; notify: (m: string) => void }) {
  async function doBackup() {
    try {
      const path = await window.aj.createBackup();
      notify(`Backup saved: ${path}`);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  async function doRestore() {
    if (!window.confirm('Restore will overwrite the current database. Continue?')) return;
    try {
      const path = await window.aj.restoreBackup(user.id);
      if (path) notify(`Restored from ${path}. Restart the app if needed.`);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section className="panel">
      <h2>Database backup & restore</h2>
      <p className="hint">All data is stored locally in SQLite. Keep regular backups.</p>
      <div className="action-list">
        <button className="primary" onClick={doBackup}>Create backup</button>
        <button onClick={async () => { const p = await window.aj.exportDatabase(); if (p) notify(`Exported to ${p}`); }}>Export database</button>
        <button className="danger" onClick={doRestore}>Restore backup</button>
      </div>
    </section>
  );
}

function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [toast, setToast] = useState('');

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  if (!user) return <Login onLogin={setUser} notify={notify} />;

  const visibleNav = nav.filter((item) => user.role === 'admin' || !item.admin);
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">AJ Motorbike Spares</div>
        <nav>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id as View)} title={item.label}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={() => setUser(null)}>
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <h1>{nav.find((item) => item.id === view)?.label}</h1>
            <p>{user.fullName} · {user.role}</p>
          </div>
        </header>
        {view === 'dashboard' && <Dashboard />}
        {view === 'sales' && <Sales user={user} notify={notify} />}
        {view === 'products' && <Products user={user} notify={notify} />}
        {view === 'inventory' && <Inventory user={user} notify={notify} />}
        {view === 'reports' && <Reports />}
        {view === 'backup' && <Backup user={user} notify={notify} />}
        {(view === 'categories' || view === 'customers' || view === 'returns' || view === 'settings' || view === 'users') && (
          <div className="panel">
            <p className="hint">Backend APIs for {view} are live. Extended forms available in local full source.</p>
          </div>
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
