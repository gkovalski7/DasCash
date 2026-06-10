/*
 * ARCHIVO: apps/web/src/pages/app/PagarComercio.tsx
 * ACCIÓN:  CREAR (archivo nuevo)
 *
 * Pantalla de confirmación de pago. El consumer llega acá después
 * de escanear el QR. Ve el comercio, ingresa el monto, elige la causa
 * y confirma. La app lo redirige a Mercado Pago.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Store as StoreIcon,
  ExternalLink,
} from 'lucide-react'
import { get, post } from '../../lib/api'

// ---- Tipos ----

interface SupportedCause {
  id: number
  title: string
  slug: string
  image_url: string
  category: string
}

interface StoreInfo {
  id: number
  name: string
  address: string
  description: string
  logo_url: string
  cashback_percentage: string | null
  supported_causes: SupportedCause[]
}

interface InitiatePaymentResponse {
  purchase_id: number
  preference_id: string
  checkout_url: string
  cashback_preview: {
    store: string
    cause: string | null
    amount: string
    cashback_percentage: string | null
  }
}

type PageState = 'loading' | 'ready' | 'redirecting' | 'not_found'

// ---- Componente ----

export default function PagarComercio() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedCauseId, setSelectedCauseId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ---- Cargar datos del comercio ----

  useEffect(() => {
    if (!slug) return
    get<StoreInfo>(`/api/commerce/stores/by-slug/${slug}/`)
      .then((data) => {
        setStore(data)
        // Preseleccionar la primera causa disponible
        if (data.supported_causes.length > 0) {
          setSelectedCauseId(data.supported_causes[0].id)
        }
        setPageState('ready')
      })
      .catch(() => {
        setPageState('not_found')
      })
  }, [slug])

  // ---- Helpers ----

  const parsedAmount = parseFloat(amount) || 0
  const cashbackPct = parseFloat(store?.cashback_percentage || '0')

  const cashbackPreview =
    parsedAmount > 0 && cashbackPct > 0
      ? (parsedAmount * cashbackPct) / 100
      : null

  const selectedCause = store?.supported_causes.find(
    (c) => c.id === selectedCauseId
  )

  // ---- Iniciar pago ----

  const handlePagar = async () => {
    if (!amount || parsedAmount <= 0) {
      setErrorMsg('Ingresá el monto de tu compra.')
      return
    }
    if (!selectedCauseId && store && store.supported_causes.length > 0) {
      setErrorMsg('Elegí la causa que querés apoyar con esta compra.')
      return
    }

    setIsProcessing(true)
    setErrorMsg('')

    try {
      const result = await post<InitiatePaymentResponse>(
        '/api/cashback/payments/initiate/',
        {
          store_slug: slug,
          amount: parsedAmount,
          selected_cause_id: selectedCauseId,
        }
      )

      // Guardar datos en sessionStorage para la pantalla de éxito
      sessionStorage.setItem('dc_purchase_id', String(result.purchase_id))
      sessionStorage.setItem('dc_store', store?.name || '')
      sessionStorage.setItem('dc_cause', selectedCause?.title || '')
      sessionStorage.setItem('dc_amount', String(parsedAmount))
      sessionStorage.setItem(
        'dc_cashback',
        cashbackPreview ? cashbackPreview.toFixed(2) : '0'
      )

      setPageState('redirecting')

      // Redirigir al checkout de MP
      // En mobile, el navegador puede capturar el deep link mercadopago://
      // y abrir la app nativa. En desktop, abre el checkout web de MP.
      window.location.href = result.checkout_url

    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'No pudimos conectar con Mercado Pago. Intentá de nuevo en un momento.'
      )
      setIsProcessing(false)
    }
  }

  // ---- Renders ----

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <AlertCircle size={52} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Comercio no encontrado
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          El QR puede estar desactualizado o el comercio no está activo.
        </p>
        <button
          onClick={() => navigate('/app/home')}
          className="text-blue-600 font-semibold text-sm"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  if (pageState === 'redirecting') {
    return (
      <div className="min-h-screen bg-[#0A2236] flex flex-col items-center justify-center px-6">
        <div className="w-14 h-14 border-2 border-white border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-white text-xl font-bold mb-2">
          Abriendo Mercado Pago…
        </h2>
        <p className="text-white/50 text-sm text-center">
          En un momento te redirigimos para completar el pago.
        </p>
      </div>
    )
  }

  // ---- Pantalla principal ----

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>

        {/* Info del comercio */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <StoreIcon size={18} className="text-blue-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
              {store?.name}
            </p>
            {store?.address && (
              <p className="text-gray-400 text-xs truncate">{store.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-sm mx-auto w-full space-y-4">

        {/* Banner de cashback activo */}
        {store?.cashback_percentage && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-5 py-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Cashback activo
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{store.cashback_percentage}%</span>
              <span className="text-blue-300 text-sm">de tu compra va al club</span>
            </div>
          </div>
        )}

        {/* Input de monto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            ¿Cuánto gastaste?
          </label>
          <div className="flex items-center">
            <span className="text-3xl text-gray-300 font-light mr-2">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              min="1"
              onChange={(e) => {
                setAmount(e.target.value)
                setErrorMsg('')
              }}
              className="flex-1 text-4xl font-black text-gray-900 bg-transparent
                         border-none outline-none placeholder-gray-200 w-full"
            />
          </div>

          {/* Preview del cashback en tiempo real */}
          {cashbackPreview !== null && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-400">Cashback para el club</span>
              <span className="text-base font-bold text-emerald-600">
                +${cashbackPreview.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Selector de causa */}
        {store && store.supported_causes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              ¿A quién querés apoyar?
            </p>
            <div className="space-y-2">
              {store.supported_causes.map((cause) => (
                <button
                  key={cause.id}
                  onClick={() => setSelectedCauseId(cause.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                               border-2 transition-all text-left ${
                                 selectedCauseId === cause.id
                                   ? 'border-blue-500 bg-blue-50'
                                   : 'border-gray-100 hover:border-gray-200 bg-white'
                               }`}
                >
                  {cause.image_url ? (
                    <img
                      src={cause.image_url}
                      alt={cause.title}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        selectedCauseId === cause.id
                          ? 'text-blue-700'
                          : 'text-gray-900'
                      }`}
                    >
                      {cause.title}
                    </p>
                    <p className="text-xs text-gray-400">{cause.category}</p>
                  </div>
                  {/* Radio visual */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center
                                 justify-center transition-colors ${
                                   selectedCauseId === cause.id
                                     ? 'border-blue-500 bg-blue-500'
                                     : 'border-gray-200'
                                 }`}
                  >
                    {selectedCauseId === cause.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resumen (si hay monto y causa) */}
        {parsedAmount > 0 && selectedCause && cashbackPreview !== null && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
              Con esta compra…
            </p>
            <p className="text-sm text-emerald-800 leading-relaxed">
              <span className="font-bold">${cashbackPreview.toFixed(2)}</span>{' '}
              van directo a{' '}
              <span className="font-bold">{selectedCause.title}</span>.
              Sin gastar un peso extra.
            </p>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle
              size={16}
              className="text-red-500 mt-0.5 flex-shrink-0"
            />
            <p className="text-sm text-red-700 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Botón de pago */}
        <button
          onClick={handlePagar}
          disabled={isProcessing || parsedAmount <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                     disabled:bg-gray-200 disabled:text-gray-400
                     text-white font-bold py-4 px-6 rounded-2xl transition-colors
                     text-base flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generando link…</span>
            </>
          ) : (
            <>
              <ExternalLink size={18} />
              <span>Pagar con Mercado Pago</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-2">
          Pagás con tu billetera habitual. El cashback se genera automáticamente
          al confirmar el pago.
        </p>
      </div>
    </div>
  )
}
