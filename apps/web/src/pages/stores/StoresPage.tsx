import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCategories, fetchStores } from '../../lib/api'
import { isAuthenticated } from '../../lib/auth'
import StoreCard, { StoreItem, Category } from '../../components/StoreCard'
import ScreenHeader from '../../components/app/ScreenHeader'

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
    <div>
      <ScreenHeader title="Comercios adheridos">
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-app text-gray-800
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
            placeholder="Buscar por nombre o descripción"
            aria-label="Buscar tiendas"
          />
        </div>
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {/* Filtros */}
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm font-app focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.slug)}>
                {c.name} {c.participates_in_cashback ? '' : '(sin cashback)'}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-app">
            <input type="checkbox" checked={onlyCashback} onChange={(e) => setOnlyCashback(e.target.checked)} className="focus:ring-brand-lime-400" />
            Solo con cashback
          </label>
        </div>

        {/* Aviso global */}
        {showGlobalNotice && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">
            Algunas tiendas tienen categorías excluidas del cashback. Revisa los avisos en cada tarjeta.
          </div>
        )}

        {/* Estados */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_,i)=>(<div key={i} className="h-28 rounded-2xl bg-gray-200/70" />))}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>
        )}
        {!loading && !error && stores.length === 0 && (
          <div className="text-gray-600 text-center py-16">No se encontraron tiendas.</div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {stores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-app rounded-xl border border-gray-300 disabled:opacity-40 hover:bg-brand-green-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 font-app">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-app rounded-xl border border-gray-300 disabled:opacity-40 hover:bg-brand-green-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
