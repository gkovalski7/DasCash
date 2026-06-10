import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Heart, ArrowRight, Home, Clock } from 'lucide-react'

export default function PagoExitoso() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [cashback, setCashback] = useState('0')
  const [cause, setCause] = useState('tu club')
  const [storeName, setStoreName] = useState('')
  const [displayAmount, setDisplayAmount] = useState(0)

  const mpStatus = searchParams.get('status') || 'approved'
  const isPending = mpStatus === 'pending' || mpStatus === 'in_process'

  useEffect(() => {
    const cb = sessionStorage.getItem('dc_cashback') || '0'
    const causeName = sessionStorage.getItem('dc_cause') || 'tu club'
    const store = sessionStorage.getItem('dc_store') || ''

    setCashback(cb)
    setCause(causeName)
    setStoreName(store)

    const target = parseFloat(cb) || 0
    if (target > 0) {
      let current = 0
      const steps = 40
      const increment = target / steps
      const timer = setInterval(() => {
        current = Math.min(current + increment, target)
        setDisplayAmount(current)
        if (current >= target) clearInterval(timer)
      }, 35)
      return () => clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      ;['dc_purchase_id', 'dc_store', 'dc_cause', 'dc_amount', 'dc_cashback'].forEach(
        (k) => sessionStorage.removeItem(k)
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2236] to-[#0F3D6A] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">

          <div className="relative mb-8 mx-auto w-fit">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              {isPending ? (
                <Clock size={44} className="text-yellow-300" strokeWidth={1.5} />
              ) : (
                <CheckCircle2 size={44} className="text-emerald-400" strokeWidth={1.5} />
              )}
            </div>
            {!isPending && (
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            )}
          </div>

          <h1 className="text-3xl font-black text-white mb-1">
            {isPending ? '¡Recibido!' : '¡Listo!'}
          </h1>
          {storeName && (
            <p className="text-white/50 text-sm mb-8">
              Compra en <span className="text-white/80 font-medium">{storeName}</span>
            </p>
          )}

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-6 py-7 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart size={18} className="text-rose-400 fill-rose-400" />
              <span className="text-white/60 text-sm font-medium">
                {isPending ? 'Cashback estimado' : 'Tu aporte al club'}
              </span>
            </div>
            <div className="text-5xl font-black text-white mb-2">
              ${displayAmount.toFixed(2)}
            </div>
            <p className="text-white/70 text-sm">
              {isPending ? 'irán a' : 'fueron a'}{' '}
              <span className="font-bold text-blue-300">{cause}</span>
            </p>
            {isPending && (
              <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-3">
                <p className="text-yellow-300 text-xs leading-relaxed">
                  El pago está siendo procesado por tu banco.
                  El cashback se confirmará en las próximas horas.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/app/causes')}
              className="w-full bg-white text-[#0A2236] font-bold py-4 rounded-2xl
                         flex items-center justify-center gap-2
                         hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <Heart size={18} className="text-blue-600" />
              Ver mi impacto total
              <ArrowRight size={18} className="text-blue-600" />
            </button>
            <button
              onClick={() => navigate('/app/scan')}
              className="w-full border border-white/20 text-white font-semibold
                         py-4 rounded-2xl flex items-center justify-center gap-2
                         hover:bg-white/10 transition-colors text-sm"
            >
              Escanear otro QR
            </button>
            <button
              onClick={() => navigate('/app/home')}
              className="w-full text-white/40 text-sm py-2 flex items-center
                         justify-center gap-1.5 hover:text-white/60 transition-colors"
            >
              <Home size={15} />
              Inicio
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
