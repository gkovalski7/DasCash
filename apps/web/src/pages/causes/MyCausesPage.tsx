import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, TrendingUp } from 'lucide-react'
import { getProfile, getProfileDonations, type ApiProfile, type ApiDonation } from '../../lib/api'
import ScreenHeader from '../../components/app/ScreenHeader'
import ProgressBar from '../../components/app/ProgressBar'

export default function MyCausesPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [donations, setDonations] = useState<ApiDonation[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([getProfile(), getProfileDonations()])
      .then(([prof, dons]) => { if (!cancelled) { setProfile(prof); setDonations(dons) } })
      .catch((err) => console.error('Error cargando impacto:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Total por causa, ordenado descendente. La barra = participación en el total.
  const causeTotals = useMemo(() => {
    const map = new Map<string, { title: string; slug: string | null; total: number }>()
    for (const d of donations) {
      const cur = map.get(d.cause_title) || { title: d.cause_title, slug: d.cause_slug, total: 0 }
      cur.total += parseFloat(d.amount) || 0
      map.set(d.cause_title, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [donations])

  const total = parseFloat(profile?.total_donated || '0')

  if (loading) {
    return <div className="px-4 py-6 space-y-3">{[0, 1, 2].map((i) =>
      <div key={i} className="h-24 rounded-2xl bg-gray-200/70 animate-pulse" />)}</div>
  }

  return (
    <div>
      <ScreenHeader eyebrow="Tu impacto 💚" title={<span className="text-3xl">${total.toFixed(2)}</span>}>
        <p className="text-xs text-white/70 mt-1">
          donados a {causeTotals.length} causa{causeTotals.length !== 1 ? 's' : ''} · {donations.length} donación{donations.length !== 1 ? 'es' : ''}
        </p>
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {causeTotals.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-bold mb-1">Todavía no donaste</p>
            <p className="text-gray-400 text-sm mb-5">Escaneá tu primer QR y empezá a generar impacto.</p>
            <Link to="/app/scan" className="inline-block bg-brand-green-600 hover:bg-brand-green-700 text-white
                                            font-bold text-sm px-6 py-3 rounded-xl transition-colors">
              Pagar con QR
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {causeTotals.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    {c.slug
                      ? <Link to={`/app/causes/${c.slug}`} className="font-extrabold text-brand-navy-900 truncate hover:text-brand-green-700">{c.title}</Link>
                      : <span className="font-extrabold text-brand-navy-900 truncate">{c.title}</span>}
                    <span className="flex-shrink-0 bg-brand-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      ${c.total.toFixed(2)}
                    </span>
                  </div>
                  <ProgressBar pct={total > 0 ? (c.total / total) * 100 : 0} />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {total > 0 ? ((c.total / total) * 100).toFixed(0) : 0}% de todo tu impacto
                  </p>
                </div>
              ))}
            </div>

            <h2 className="font-extrabold text-brand-navy-900 flex items-center gap-1.5 pt-2">
              <TrendingUp size={16} className="text-brand-green-600" /> Últimas donaciones
            </h2>
            <div className="space-y-2">
              {donations.slice(0, 10).map((d) => (
                <div key={d.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3
                                           shadow-[0_1px_4px_rgba(10,34,54,0.06)]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-navy-900 truncate">{d.store_name}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      → {d.cause_title} · {new Date(d.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-extrabold text-brand-green-700">
                    +${parseFloat(d.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
