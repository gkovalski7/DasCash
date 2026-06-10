import React from 'react'
import { Link } from 'react-router-dom'
import { useFeaturedCauses } from '../api/useFeaturedCauses'

export default function FeaturedCauses({ title = 'Causas destacadas', limit = 6 }: { title?: string; limit?: number }) {
  const { data, loading, error } = useFeaturedCauses(limit)

  return (
    <section className="py-10 md:py-12 bg-[color:var(--navy-800)] text-white relative overflow-hidden">
  <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.06] pointer-events-none" />
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10 relative">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h2>

        {loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: limit }).map((_, i) => (
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
        )}

        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((c) => (
              <article key={c.id} className="group rounded-xl overflow-hidden border border-white/10 bg-[color:var(--navy-900)] text-white shadow-sm hover:shadow-lg transition">
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={`Imagen de la causa ${c.title}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70">Sin imagen</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="p-4">
                  {c.category && (
                    <span className="inline-flex items-center rounded-full bg-brand-lime-400 text-[color:var(--navy-900)] px-2.5 py-0.5 text-xs font-semibold">
                      {c.category}
                    </span>
                  )}
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">{c.title}</h3>
                  {c.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-white/80">{c.summary}</p>
                  )}
                  <div className="mt-3">
                    <Link to={`/causas/${c.slug}`} className="text-sm font-medium text-brand-blue-600 hover:underline" aria-label={`Ver detalle de ${c.title}`}>
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
      </div>
    </section>
  )
}
