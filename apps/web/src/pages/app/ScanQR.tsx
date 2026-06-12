import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, X, ScanLine, AlertCircle } from 'lucide-react'
import { QRScanner } from '../../components/QRScanner'

type ScreenState = 'intro' | 'scanning' | 'error'

export default function ScanQR() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<ScreenState>('intro')
  const [errorMsg, setErrorMsg] = useState('')

  const handleScanResult = useCallback(
    (decodedText: string) => {
      setErrorMsg('')

      try {
        const url = new URL(decodedText)
        const parts = url.pathname.split('/').filter(Boolean)
        const pagarIndex = parts.indexOf('pagar')
        if (pagarIndex !== -1 && parts[pagarIndex + 1]) {
          navigate(`/app/pagar/${parts[pagarIndex + 1]}`)
          return
        }
      } catch {
        // not an absolute URL
      }

      const cleaned = decodedText.trim()
      if (/^[a-z0-9-]+$/.test(cleaned)) {
        navigate(`/app/pagar/${cleaned}`)
        return
      }

      setErrorMsg(
        'QR no reconocido. Asegurate de escanear el código de un comercio adherido a DasCash.'
      )
      setScreen('error')
    },
    [navigate]
  )

  return (
    <div className="min-h-screen bg-[#0A2236] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                     hover:bg-white/20 transition-colors"
          aria-label="Volver"
        >
          <X size={18} className="text-white" />
        </button>
        <h1 className="text-white font-semibold text-base">Escanear QR</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pt-4 pb-10 max-w-sm mx-auto w-full">

        {screen === 'intro' && (
          <>
            <div className="relative mt-6 mb-8">
              <div className="w-28 h-28 rounded-3xl bg-brand-green-600/20 border border-brand-lime-400/30
                              flex items-center justify-center">
                <QrCode size={52} className="text-brand-lime-400" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-brand-lime-400/60 animate-[scanLine_2s_ease-in-out_infinite]" />
              </div>
            </div>

            <h2 className="text-white text-2xl font-bold text-center mb-3">
              Pagá y apoyá a tu club
            </h2>
            <p className="text-white/50 text-sm text-center leading-relaxed mb-10">
              Escaneá el QR del comercio. Un porcentaje de tu compra
              va directo al club que elegiste — sin gastar un peso extra.
            </p>

            <button
              onClick={() => setScreen('scanning')}
              className="w-full bg-brand-green-600 hover:bg-brand-green-700 active:bg-brand-green-700
                         text-white font-bold py-4 rounded-2xl transition-colors
                         flex items-center justify-center gap-2 text-base"
            >
              <ScanLine size={20} />
              Activar cámara
            </button>

            <p className="text-white/30 text-xs text-center mt-4">
              DasCash pedirá permiso para acceder a tu cámara.
            </p>
          </>
        )}

        {screen === 'scanning' && (
          <>
            <p className="text-white/60 text-sm text-center mb-4 mt-2">
              Apuntá la cámara al código QR del comercio
            </p>
            <div className="w-full">
              <QRScanner onScanSuccess={handleScanResult} />
            </div>
            <button
              onClick={() => setScreen('intro')}
              className="mt-5 text-white/40 text-sm hover:text-white/70 transition-colors py-2"
            >
              Cancelar
            </button>
          </>
        )}

        {screen === 'error' && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <AlertCircle size={36} className="text-red-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">QR no reconocido</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">{errorMsg}</p>
            <button
              onClick={() => setScreen('scanning')}
              className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold
                         py-4 rounded-2xl transition-colors mb-3"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => navigate(-1)}
              className="text-white/40 text-sm hover:text-white/60 transition-colors py-2"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
