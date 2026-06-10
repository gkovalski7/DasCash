import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Heart, TrendingUp, ArrowRight } from 'lucide-react'
import { fetchCauses, fetchFeaturedCauses, getProfile, type ApiCause, type ApiProfile } from '../../lib/api'

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [causes, setCauses] = useState<ApiCause[]>([])
  const [featured, setFeatured] = useState<ApiCause[]>([])
  const [profile, setProfile] = useState<ApiProfile | null>(null)

  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState(params.get('category') || '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [feats, prof] = await Promise.all([fetchFeaturedCauses(), getProfile()])
        if (cancelled) return
        setFeatured(feats)
        setProfile(prof)

        const q = new URLSearchParams()
        if (search) q.set('search', search)
        if (category) q.set('category', category)
        const list = await fetchCauses(q)
        if (!cancelled) setCauses(list)
      } catch (err) {
        console.error('Error fetching home data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [search, category])

  useEffect(() => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    if (category) next.set('category', category)
    setParams(next, { replace: true })
  }, [search, category, setParams])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    ;[...featured, ...causes].forEach((c) => { if (c.category) seen.add(c.category) })
    return Array.from(seen)
  }, [featured, causes])

  const firstName = profile?.first_name || profile?.email?.split('@')[0] || 'Usuario'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-body">Cargando causas…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Greeting bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-gray-400 font-body uppercase tracking-wide mb-0.5">
            Bienvenido/a de vuelta
          </p>
          <h1 className="text-2xl font-display font-bold text-brand-navy-900">
            Hola, {firstName} 👋
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Impact banner */}
        {profile && (
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-brand-navy-900 to-[#0F2E48] p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-brand-lime-300 text-xs font-semibold uppercase tracking-widest font-body mb-2">
                Tu impacto acumulado
              </p>
              <h2 className="text-xl sm:text-2xl font-display font-bold mb-5 leading-tight">
                Cada compra suma para tus causas
              </h2>
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-display font-bold text-brand-lime-300">
                    ${parseFloat(profile.total_donated).toFixed(2)}
                  </p>
                  <p className="text-white/50 text-xs font-body mt-0.5">Donado</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-brand-lime-300">
                    {profile.purchases_count}
                  </p>
                  <p className="text-white/50 text-xs font-body mt-0.5">Compras</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-brand-lime-300">
                    {profile.causes_count}
                  </p>
                  <p className="text-white/50 text-xs font-body mt-0.5">Causas apoyadas</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex w-28 h-28 rounded-3xl bg-white/5 border border-white/10 items-center justify-center flex-shrink-0">
              <TrendingUp size={44} className="text-brand-lime-300" />
            </div>
          </div>
        )}

        {/* Destacadas */}
        {featured.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-display font-bold text-brand-navy-900 mb-4">Causas destacadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 3).map((cause) => (
                <CauseCard key={cause.id} cause={cause} />
              ))}
            </div>
          </div>
        )}

        {/* Sección causas */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-brand-navy-900">
            Explorá las causas
          </h2>
          <span className="text-xs text-gray-400 font-body">
            {causes.length} disponible{causes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-600/20 focus:border-brand-blue-600 transition-all"
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-7">
            <FilterPill label="Todas" active={category === ''} onClick={() => setCategory('')} />
            {categories.map((cat) => (
              <FilterPill key={cat} label={cat} active={category === cat} onClick={() => setCategory(cat)} />
            ))}
          </div>
        )}

        {/* Grid */}
        {causes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={22} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-body">
              No encontramos causas con ese criterio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {causes.map((cause) => (
              <CauseCard key={cause.id} cause={cause} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Sub-components ---- */

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
        active
          ? 'bg-brand-navy-900 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-navy-900 hover:text-brand-navy-900'
      }`}
    >
      {label}
    </button>
  )
}

function CauseCard({ cause }: { cause: ApiCause }) {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {cause.is_featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-brand-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full font-body flex items-center gap-1">
            <Heart size={9} className="fill-white" /> Destacada
          </span>
        </div>
      )}

      <div className="h-36 bg-gradient-to-br from-brand-blue-50 to-brand-sky-50 flex items-center justify-center overflow-hidden">
        {cause.image_url ? (
          <img src={cause.image_url} alt={cause.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-brand-blue-600/10 flex items-center justify-center">
            <Heart size={28} className="text-brand-blue-600" />
          </div>
        )}
      </div>

      <div className="p-5">
        {cause.category && (
          <span className="inline-block text-xs font-body font-medium text-brand-blue-600 bg-brand-blue-50 px-2.5 py-0.5 rounded-full mb-2">
            {cause.category}
          </span>
        )}

        <h3 className="font-display font-bold text-brand-navy-900 text-base mb-1 line-clamp-1">
          {cause.title}
        </h3>
        <p className="text-brand-gray-500 text-sm font-body line-clamp-2 mb-4 leading-relaxed">
          {cause.summary}
        </p>

        <Link
          to={`/app/causes/${cause.slug}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-navy-900 text-white text-sm font-body font-semibold hover:bg-brand-blue-600 transition-colors"
        >
          Ver causa <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
