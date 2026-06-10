import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { fetchCauseBySlug, type ApiCause } from '../../lib/api'

export default function CauseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const isInApp = location.pathname.startsWith('/app')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cause, setCause] = useState<ApiCause | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchCauseBySlug(slug!)
        if (!cancelled) setCause(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'No se pudo cargar la causa')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-6 pb-12">
        <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10 animate-pulse">
          <div className="h-8 w-1/3 rounded bg-gray-200 mb-4" />
          <div className="w-full rounded-lg bg-gray-100" style={{ aspectRatio: '21 / 9' }} />
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  if (error || !cause) {
    return (
      <div className="min-h-screen bg-white pt-6 pb-12">
        <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {cause === null && !error ? 'Causa no encontrada' : 'Error'}
            </h2>
            <p className="text-red-700">{error || `No encontramos una causa con slug "${slug}".`}</p>
            <Link to="/causas" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              ← Volver a causas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-6 pb-12">
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link to={isInApp ? '/app/causes' : '/causas'} className="hover:text-gray-700">{isInApp ? 'Mis Causas' : 'Causas'}</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{cause.title}</span>
        </nav>

        {/* Hero image */}
        {cause.image_url && (
          <div className="relative w-full overflow-hidden rounded-lg mb-6" style={{ aspectRatio: '21 / 9' }}>
            <img
              src={cause.image_url}
              alt={`Imagen de ${cause.title}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Title + category badge */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{cause.title}</h1>
          {cause.category && (
            <span className="inline-flex items-center rounded-full bg-[#ACC500] text-[#00264E] px-3 py-0.5 text-xs font-semibold">
              {cause.category}
            </span>
          )}
          {cause.is_featured && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-0.5 text-xs font-semibold">
              Destacada
            </span>
          )}
        </div>

        {/* Summary */}
        {cause.summary && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 text-base leading-relaxed">{cause.summary}</p>
          </div>
        )}
      </div>
    </div>
  )
}
