import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import ProductFormPage from './pages/ProductFormPage'
import ProductDetailPage from './pages/ProductDetailPage'
import POSPage from './pages/POSPage'
import SalesPage from './pages/SalesPage'
import SaleDetailPage from './pages/SaleDetailPage'
import PurchasesPage from './pages/PurchasesPage'
import SuppliersPage from './pages/SuppliersPage'
import CustomersPage from './pages/CustomersPage'
import ExpensesPage from './pages/ExpensesPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import StockMovementsPage from './pages/StockMovementsPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoadingScreen from './components/common/LoadingScreen'
import ConfigMissingPage from './pages/ConfigMissingPage'
import InstallPrompt from './components/pwa/InstallPrompt'
import SaleNotifications from './components/pwa/SaleNotifications'

export default function App() {
  const { loading, firebaseReady } = useAuth()

  if (loading) return <LoadingScreen />

  if (!firebaseReady) {
    return <ConfigMissingPage />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <>
              <SaleNotifications />
              <InstallPrompt />
              <DashboardLayout />
            </>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/new" element={<ProductFormPage />} />
        <Route path="inventory/:id" element={<ProductDetailPage />} />
        <Route path="inventory/:id/edit" element={<ProductFormPage />} />
        <Route path="stock-movements" element={<StockMovementsPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
