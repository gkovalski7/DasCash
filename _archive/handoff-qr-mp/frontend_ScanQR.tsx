/*
 * ARCHIVO: apps/web/src/pages/app/ScanQR.tsx
 * ACCIÓN:  CREAR (archivo nuevo)
 *
 * Pantalla de escaneo de QR. El consumer llega acá desde el botón
 * "Pagar con QR" del nav. Activa la cámara y redirige al flujo de pago.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, X, ScanLine, AlertCircle } from 'lucide-react'
import { QRScanner } from '../../components/QRScanner'

type ScreenState = 'intro' | 'scanning' | 'error'

export default function ScanQR() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<ScreenState>('intro')
  const [errorMsg, setErrorMsg] = useState('')

  /**
   * Procesa el texto decodificado del QR.
   * El QR de un comercio DasCash encode:
   *   https://{dominio}/app/pagar/{store_slug}
   *
   * Si el QR es de otro origen, mostramos error.
   */
  const handleScanResult = useCallback(
    (decodedText: string) => {
      setErrorMsg('')

      try {
        // Intentar parsear como URL absoluta
        const url = new URL(decodedText)
        const parts = url.pathname.split('/').filter(Boolean)
        // Buscar el segmento "pagar" en el path
        const pagarIndex = parts.indexOf('pagar')
        if (pagarIndex !== -1 && parts[pagarIndex + 1]) {
          const slug = parts[pagarIndex + 1]
          navigate(`/app/pagar/${slug}`)
          return
        }
      } catch {
        // No es una URL absoluta — ignorar error de parseo
      }

      // Fallback: si el texto es un slug puro sin espacios ni caracteres raros
      const cleaned = decodedText.trim()
      if (/^[a-z0-9-]+$/.test(cleaned)) {
        navigate(`/app/pagar/${cleaned}`)
        return
      }

      // QR inválido
      setErrorMsg(
        'QR no reconocido. Asegurate de escanear el código de un comercio adherido a DasCash.'
      )
      setScreen('error')
    },
    [navigate]
  )

  return (
    <div className="min-h-screen bg-[#0A2236] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
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

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center px-5 pt-4 pb-10 max-w-sm mx-auto w-full">

        {screen === 'intro' && (
          <>
            {/* Ícono animado */}
            <div className="relative mt-6 mb-8">
              <div className="w-28 h-28 rounded-3xl bg-blue-600/20 border border-blue-400/30
                              flex items-center justify-center">
                <QrCode size={52} className="text-blue-400" strokeWidth={1.5} />
              </div>
              {/* Línea de scaneo animada */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-blue-400/60 animate-[scanLine_2s_ease-in-out_infinite]" />
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
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700
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
              <QRScanner
                onScanSuccess={handleScanResult}
              />
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold
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

/*
 * AGREGAR en apps/web/src/styles/globals.css:
 *
 * @keyframes scanLine {
 *   0%, 100% { transform: translateY(-48px); opacity: 0; }
 *   20%, 80% { opacity: 1; }
 *   50% { transform: translateY(48px); }
 * }
 */
