import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Store as StoreIcon, Heart } from 'lucide-react'
import {
  get, fetchStores, getProfile, getProfileDonations,
  type ApiStore, type ApiCategory, type ApiProfile, type ApiDonation,
} from '../../lib/api'
import ScreenHeader from '../../components/app/ScreenHeader'
import ProgressBar from '../../components/app/ProgressBar'
import Chip from '../../components/app/Chip'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [donations, setDonations] = useState<ApiDonation[]>([])
  const [stores, setStores] = useState<ApiStore[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProfile(),
      getProfileDonations().catch(() => [] as ApiDonation[]),
      get<ApiCategory[]>('/api/commerce/categories/'),
    ]).then(([prof, dons, cats]) => {
      if (cancelled) return
      setProfile(prof); setDonations(dons); setCategories(cats)
    }).catch((err) => console.error('Error cargando home:', err))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const q = new URLSearchParams()
    if (search) q.set('search', search)
    if (category) q.set('category', category)
    fetchStores(q)
      .then((page) => { if (!cancelled) setStores(page.results) })
      .catch((err) => console.error('Error cargando tiendas:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, category])

  // Causa más apoyada (derivada del historial real) e impacto del mes
  const { topCause, monthTotal } = useMemo(() => {
    const byCause = new Map<string, number>()
    let month = 0
    const now = new Date()
    for (const d of donations) {
      const amt = parseFloat(d.amount) || 0
      byCause.set(d.cause_title, (byCause.get(d.cause_title) || 0) + amt)
      const dt = new Date(d.created_at)
      if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) month += amt
    }
    let top: string | null = null, topAmt = 0
    byCause.forEach((amt, title) => { if (amt > topAmt) { top = title; topAmt = amt } })
    return { topCause: top, monthTotal: month }
  }, [donations])

  const totalDonated = parseFloat(profile?.total_donated || '0')
  const monthPct = totalDonated > 0 ? (monthTotal / totalDonated) * 100 : 0
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || ''

  return (
    <div>
      <ScreenHeader
        eyebrow={`Hola ${firstName} 👋${topCause ? ' · estás apoyando a' : ''}`}
        title={topCause ? <>{topCause} 💚</> : '¿Dónde comprás hoy?'}
      >
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar comercios…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-app text-gray-800
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
          />
        </div>
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {profile && (
          <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-brand-green-700 text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Tu impacto este mes</span>
              <span className="text-lg font-extrabold">${monthTotal.toFixed(2)}</span>
            </div>
            <ProgressBar pct={monthPct} className="mt-2 bg-white/20" />
            <p className="text-[11px] text-white/70 mt-1.5">
              ${totalDonated.toFixed(2)} donados en total · {profile.causes_count} causa{profile.causes_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Chip label="Todos" active={category === ''} onClick={() => setCategory('')} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={category === c.slug} onClick={() => setCategory(c.slug)} />
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200/70 animate-pulse" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <StoreIcon size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No encontramos comercios con ese criterio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((s) => <HomeStoreCard key={s.id} store={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function HomeStoreCard({ store }: { store: ApiStore }) {
  return (
    <Link
      to={`/app/stores/${store.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(10,34,54,0.08)]
                 hover:shadow-md transition-shadow"
    >
      <div className="h-20 bg-gradient-to-br from-brand-navy-900 to-brand-green-600 flex items-center justify-center">
        {store.logo_url
          ? <img src={store.logo_url} alt={store.display_name} className="h-12 w-12 rounded-xl object-cover" />
          : <StoreIconFallback />}
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-app font-extrabold text-brand-navy-900 truncate">{store.display_name}</h3>
          <p className="text-xs text-gray-400 truncate">
            {[store.categories.map((c) => c.name).join(' · '), store.address].filter(Boolean).join(' — ')}
          </p>
        </div>
        {store.supported_causes.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 bg-brand-green-50 text-brand-green-700
                           text-xs font-bold px-2.5 py-1 rounded-lg">
            <Heart size={11} className="fill-current" /> {store.supported_causes.length} causa{store.supported_causes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}

function StoreIconFallback() {
  return (
    <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
      <StoreIcon size={22} className="text-white" />
    </div>
  )
}
