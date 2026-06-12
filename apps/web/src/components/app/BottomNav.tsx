import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Store, QrCode, TrendingUp, User } from 'lucide-react'

const itemCls = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 text-[11px] font-app font-semibold transition-colors ${
    isActive ? 'text-brand-green-700' : 'text-gray-400 hover:text-gray-600'
  }`

export default function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="sticky bottom-0 z-40 w-full max-w-[480px] mx-auto bg-white border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around py-2">
        <NavLink to="/app/home" className={itemCls}><Home size={20} />Inicio</NavLink>
        <NavLink to="/app/stores" className={itemCls}><Store size={20} />Tiendas</NavLink>
        <button
          onClick={() => navigate('/app/scan')}
          aria-label="Pagar con QR"
          className="-mt-7 w-14 h-14 rounded-full bg-brand-green-600 text-white border-4 border-white
                     shadow-[0_4px_14px_rgba(101,163,13,0.45)] flex flex-col items-center justify-center
                     hover:bg-brand-green-700 transition-colors"
        >
          <QrCode size={22} />
          <span className="text-[9px] font-app font-bold leading-none">QR</span>
        </button>
        <NavLink to="/app/causes" className={itemCls}><TrendingUp size={20} />Impacto</NavLink>
        <NavLink to="/app/profile" className={itemCls}><User size={20} />Perfil</NavLink>
      </div>
    </nav>
  )
}
