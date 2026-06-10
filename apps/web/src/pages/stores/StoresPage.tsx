import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCategories, fetchStores } from '../../lib/api'
import { isAuthenticated } from '../../lib/auth'
import StoreCard, { StoreItem, Category } from '../../components/StoreCard'

export default function StoresPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [stores, setStores] = useState<StoreItem[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 20

  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState<string>(params.get('category') || '')
  const [onlyCashback, setOnlyCashback] = useState(params.get('participates') === 'true')

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const cats = await fetchCategories()
        if (!cancelled) setCategories(cats)

        const q = new URLSearchParams()
        if (search) q.set('search', search)
        if (category) q.set('category', category)
        if (onlyCashback) q.set('participates', 'true')
        q.set('page', String(page))
        const paginated = await fetchStores(q)
        if (!cancelled) {
          setStores(paginated.results)
          setTotalCount(paginated.count)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error al cargar tiendas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [search, category, onlyCashback, page])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, category, onlyCashback])

  // Sync filters to querystring
  useEffect(() => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    if (category) next.set('category', category)
    if (onlyCashback) next.set('participates', 'true')
    setParams(next, { replace: true })
  }, [search, category, onlyCashback, setParams])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const showGlobalNotice = useMemo(() => stores.some(s => s.has_excluded_categories), [stores])

  return (
    <div className="min-h-screen bg-white pt-6 pb-12">
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tiendas</h1>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por nombre o descripción"
              aria-label="Buscar tiendas"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.slug)}>
                  {c.name} {c.participates_in_cashback ? '' : '(sin cashback)'}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={onlyCashback} onChange={(e) => setOnlyCashback(e.target.checked)} />
              Solo con cashback
            </label>
          </div>
        </div>

        {/* Aviso global */}
        {showGlobalNotice && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            Algunas tiendas tienen categorías excluidas del cashback. Revisa los avisos en cada tarjeta.
          </div>
        )}

        {/* Estados */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_,i)=>(<div key={i} className="h-44 rounded-lg bg-gray-100" />))}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>
        )}
        {!loading && !error && stores.length === 0 && (
          <div className="text-gray-600">No se encontraron tiendas.</div>
        )}

        {/* Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
