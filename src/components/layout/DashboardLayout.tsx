import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Truck, Users,
  Wallet, BarChart3, Settings, LogOut, Menu, X, Bike, ArrowLeftRight,
  UserCog, ChevronDown
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CASHIER', 'STOREKEEPER'] },
  { to: '/pos', label: 'POS', icon: ShoppingCart, roles: ['ADMIN', 'CASHIER'] },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'CASHIER', 'STOREKEEPER'] },
  { to: '/stock-movements', label: 'Stock Movements', icon: ArrowLeftRight, roles: ['ADMIN', 'STOREKEEPER'] },
  { to: '/sales', label: 'Sales', icon: Receipt, roles: ['ADMIN', 'CASHIER'] },
  { to: '/purchases', label: 'Purchases', icon: Truck, roles: ['ADMIN', 'STOREKEEPER'] },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['ADMIN', 'STOREKEEPER'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'CASHIER'] },
  { to: '/expenses', label: 'Expenses', icon: Wallet, roles: ['ADMIN'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
]

export default function DashboardLayout() {
  const { appUser, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filteredNav = navItems.filter((item) => hasRole(...(item.roles as any)))

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-950 text-white transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500">
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">A.J Motorbike Spares</p>
            <p className="truncate text-xs text-zinc-400">& Accessories</p>
          </div>
          <button
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold">
              {appUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{appUser?.displayName}</p>
              <p className="truncate text-xs text-zinc-400">{appUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
          <button
            className="lg:hidden rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100"
            >
              <span className="hidden sm:inline font-medium text-zinc-700">
                {appUser?.displayName}
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
