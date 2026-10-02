import React, { useState } from 'react';
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
import type { SessionUser } from '../shared/types';
import { errorMessage } from './helpers';
import { Sales } from './pages/Sales';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { Inventory } from './pages/Inventory';
import { CustomersPanel } from './pages/Customers';
import { Returns } from './pages/Returns';
import { Reports } from './pages/Reports';
import { SettingsPanel } from './pages/Settings';
import { UsersPanel } from './pages/Users';
import { Backup } from './pages/Backup';
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
      
      </form>
    </div>
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
            <p>
              {user.fullName} · {user.role}
            </p>
          </div>
        </header>
        {view === 'dashboard' && <Dashboard />}
        {view === 'sales' && <Sales user={user} notify={notify} />}
        {view === 'products' && <Products user={user} notify={notify} />}
        {view === 'categories' && <Categories user={user} notify={notify} />}
        {view === 'inventory' && <Inventory user={user} notify={notify} />}
        {view === 'customers' && <CustomersPanel user={user} notify={notify} />}
        {view === 'returns' && <Returns user={user} notify={notify} />}
        {view === 'reports' && <Reports />}
        {view === 'settings' && <SettingsPanel user={user} notify={notify} />}
        {view === 'users' && <UsersPanel user={user} notify={notify} />}
        {view === 'backup' && <Backup user={user} notify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
