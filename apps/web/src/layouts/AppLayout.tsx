import React from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { isAuthenticated, clearTokens, getAccessToken } from '../lib/auth'
import { getRole } from '../lib/role'

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [location, navigate])

  function logout() {
    clearTokens()
    navigate('/login', { replace: true })
  }

  // Basic decode for email from JWT if present (no deps). If not present, show placeholder.
  let email: string | null = null
  try {
    const token = getAccessToken()
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      email = payload?.email || payload?.username || null
    }
  } catch { }

  const role = getRole()
  const isMerchantOrAdmin = role === 'MERCHANT' || role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
  const mobileNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'font-semibold text-gray-900' : 'text-gray-600'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6 md:px-8 lg:px-10">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">DasCash</Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/app/home" className={navCls}>Inicio</NavLink>
            <NavLink to="/app/dashboard" className={navCls}>Dashboard</NavLink>
            <NavLink to="/app/stores" className={navCls}>Tiendas</NavLink>
            {isMerchantOrAdmin ? (
              <NavLink to="/app/merchant/purchases" className={navCls}>Pendientes</NavLink>
            ) : (
              <NavLink to="/app/purchases" className={navCls}>Mis Compras</NavLink>
            )}
            <NavLink to="/app/causes" className={navCls}>Mi Impacto</NavLink>
            {isAdmin && <NavLink to="/app/admin" className={navCls}>Admin</NavLink>}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/scan')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white
                         rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              <QrCode size={15} />
              <span className="hidden sm:inline">Pagar con QR</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                {(email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[180px] truncate" title={email || ''}>{email || 'User'}</span>
            </div>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-200">
          <div className="mx-auto max-w-screen-xl px-6 py-2 flex items-center gap-4 text-sm overflow-x-auto">
            <NavLink to="/app/home" className={mobileNavCls}>Inicio</NavLink>
            <NavLink to="/app/dashboard" className={mobileNavCls}>Dashboard</NavLink>
            <NavLink to="/app/stores" className={mobileNavCls}>Tiendas</NavLink>
            {isMerchantOrAdmin ? (
              <NavLink to="/app/merchant/purchases" className={mobileNavCls}>Pendientes</NavLink>
            ) : (
              <NavLink to="/app/purchases" className={mobileNavCls}>Compras</NavLink>
            )}
            <NavLink to="/app/causes" className={mobileNavCls}>Impacto</NavLink>
            {isAdmin && <NavLink to="/app/admin" className={mobileNavCls}>Admin</NavLink>}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
