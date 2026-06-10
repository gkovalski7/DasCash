import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCauses } from '../../features/causes/api/useCauses'

const CATEGORIES = ['Educación', 'Salud', 'Ambiente', 'Deporte']

export default function CausesListPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState<string>(params.get('q') || '')
  const [category, setCategory] = useState<string>(params.get('category') || '')

  const queryParams = useMemo(() => ({
    search: search || undefined,
    category: category || undefined,
  }), [search, category])

  const { data, loading, error } = useCauses(queryParams)

  function applyFilters(nextSearch: string, nextCategory: string) {
    const q = new URLSearchParams()
    if (nextSearch) q.set('q', nextSearch)
    if (nextCategory) q.set('category', nextCategory)
    setParams(q, { replace: true })
  }

  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Causas</h1>

        {/* Filtros */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="search"
            placeholder="Buscar causa..."
            value={search}
            onChange={(e) => {
              const v = e.target.value
              setSearch(v)
              applyFilters(v, category)
            }}
            className="w-full md:w-1/2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar causa"
          />
          <select
            value={category}
            onChange={(e) => {
              const v = e.target.value
              setCategory(v)
              applyFilters(search, v)
            }}
            className="w-full md:w-56 rounded-lg border border-gray-300 px-3 py-2 bg-white"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                <div className="w-full bg-slate-200" style={{ aspectRatio: '16 / 9' }} />
                <div className="p-4">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-2 h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((c) => (
              <article key={c.id} className="group rounded-xl overflow-hidden border border-white/10 bg-white shadow-sm hover:shadow-lg transition">
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={`Imagen de la causa ${c.title}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">Sin imagen</div>
                  )}
                </div>
                <div className="p-4">
                  {c.category && (
                    <span className="inline-flex items-center rounded-full bg-[#ACC500] text-[#00264E] px-2.5 py-0.5 text-xs font-semibold">
                      {c.category}
                    </span>
                  )}
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">{c.title}</h3>
                  {c.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">{c.summary}</p>
                  )}
                  <div className="mt-3">
                    <Link to={`/causas/${c.slug}`} className="text-sm font-medium text-[#00264E] hover:underline" aria-label={`Ver detalle de ${c.title}`}>
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="mt-6 text-sm text-slate-600">No encontramos causas con esos filtros.</div>
        )}
      </div>
    </section>
  )
}
