import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'
import LoadingScreen from '../common/LoadingScreen'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, appUser, loading, hasRole } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user || !appUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !hasRole(...roles)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
