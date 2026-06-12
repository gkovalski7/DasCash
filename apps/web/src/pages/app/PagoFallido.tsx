import { useNavigate } from 'react-router-dom'
import { XCircle, RotateCcw, Home } from 'lucide-react'

export default function PagoFallido() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <XCircle size={40} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago no completado</h1>
      <p className="text-gray-500 text-sm text-center leading-relaxed mb-8 max-w-xs">
        El pago fue rechazado o cancelado. Podés intentarlo de nuevo
        con otro medio de pago.
      </p>
      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={() => navigate(-2)}
          className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold
                     py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={18} />
          Intentar de nuevo
        </button>
        <button
          onClick={() => navigate('/app/home')}
          className="w-full text-gray-500 font-medium py-3 flex items-center
                     justify-center gap-2 hover:text-gray-700 transition-colors"
        >
          <Home size={18} />
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
