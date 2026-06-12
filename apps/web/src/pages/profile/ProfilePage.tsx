import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getProfile, getProfileDonations, patchProfile, type ApiProfile, type ApiDonation } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import ScreenHeader from '../../components/app/ScreenHeader'
import { getRole } from '../../lib/role'
import { clearTokens } from '../../lib/auth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [donations, setDonations] = useState<ApiDonation[]>([])

  // Inline-edit state
  const [editing, setEditing] = useState(false)
  const [editFirst, setEditFirst] = useState('')
  const [editLast, setEditLast] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [p, d] = await Promise.all([getProfile(), getProfileDonations()])
        if (!cancelled) {
          setProfile(p)
          setDonations(d)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error al cargar el perfil')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function startEdit() {
    if (!profile) return
    setEditFirst(profile.first_name)
    setEditLast(profile.last_name)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const updated = await patchProfile({ first_name: editFirst, last_name: editLast })
      setProfile(updated)
      setEditing(false)
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    clearTokens()
    navigate('/login', { replace: true })
  }

  const topByCause = useMemo(() => {
    const agg: Record<string, number> = {}
    donations.forEach(d => {
      agg[d.cause_title] = (agg[d.cause_title] || 0) + parseFloat(d.amount)
    })
    const entries = Object.entries(agg).sort((a, b) => b[1] - a[1])
    const top5 = entries.slice(0, 5)
    const others = entries.slice(5)
    if (others.length) top5.push(['Otros', others.reduce((s, [, v]) => s + v, 0)])
    return top5
  }, [donations])

  const role = getRole()
  const displayName = profile
    ? (profile.first_name || profile.last_name
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : profile.username)
    : ''
  const initial = (displayName || profile?.email || '?').charAt(0).toUpperCase()

  return (
    <div>
      <ScreenHeader title="Mi perfil">
        {profile && (
          <div className="flex items-center gap-3 mt-2">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-xl font-extrabold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{displayName}</p>
              <p className="text-xs text-white/70 truncate">{profile.email}</p>
            </div>
          </div>
        )}
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {loading && (
          <div className="grid grid-cols-3 gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (<div key={i} className="h-20 rounded-2xl bg-gray-100" />))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">{error}</div>
        )}

        {!loading && profile && (
          <>
            {/* KPI mini-cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] py-3 text-center">
                <p className="text-[11px] text-gray-400">Total donado</p>
                <p className="text-lg font-extrabold text-brand-green-700">${parseFloat(profile.total_donated).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] py-3 text-center">
                <p className="text-[11px] text-gray-400">Compras</p>
                <p className="text-lg font-extrabold text-brand-green-700">{profile.purchases_count}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] py-3 text-center">
                <p className="text-[11px] text-gray-400">Causas</p>
                <p className="text-lg font-extrabold text-brand-green-700">{profile.causes_count}</p>
              </div>
            </div>

            {/* Edit profile */}
            <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  {!editing ? (
                    <>
                      <p className="font-extrabold text-brand-navy-900">{displayName}</p>
                      <p className="text-xs text-gray-400">{profile.email}</p>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                        <input
                          value={editFirst}
                          onChange={e => setEditFirst(e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Apellido</label>
                        <input
                          value={editLast}
                          onChange={e => setEditLast(e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
                        />
                      </div>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="h-9 px-4 rounded-xl bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <Button variant="secondary" onClick={() => setEditing(false)} className="h-9 px-4 text-sm rounded-xl">Cancelar</Button>
                    </div>
                  )}
                  <span className="inline-block mt-2 text-xs rounded-lg bg-brand-green-50 text-brand-green-700 px-2 py-0.5 font-bold">{profile.role}</span>
                </div>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-bold text-brand-navy-900 hover:bg-brand-green-50 transition-colors"
                  >
                    Editar perfil
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Donaciones por causa */}
        {!loading && !!topByCause.length && (
          <div>
            <h2 className="font-extrabold text-brand-navy-900 mb-2">Donaciones por causa</h2>
            <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="py-2 px-4">Causa</th>
                    <th className="py-2 px-4">Donado</th>
                  </tr>
                </thead>
                <tbody>
                  {topByCause.map(([c, v]) => (
                    <tr key={c} className="border-t border-gray-100">
                      <td className="py-2 px-4">{c}</td>
                      <td className="py-2 px-4 font-bold text-brand-green-700">${(v as number).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        {!loading && (
          <div>
            <h2 className="font-extrabold text-brand-navy-900 mb-2">Actividad reciente</h2>
            {donations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] text-gray-500 py-6 text-center">
                <p className="text-sm font-bold">Sin donaciones aún</p>
                <p className="text-xs mt-1">Cuando hagas compras y se aprueben, tus donaciones aparecerán aquí.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs">
                      <th className="py-2 px-4">Fecha</th>
                      <th className="py-2 px-4">Comercio</th>
                      <th className="py-2 px-4">Causa</th>
                      <th className="py-2 px-4">Compra</th>
                      <th className="py-2 px-4">%</th>
                      <th className="py-2 px-4">Donado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id} className="border-t border-gray-100">
                        <td className="py-2 px-4">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-4">{d.store_name}</td>
                        <td className="py-2 px-4">{d.cause_title}</td>
                        <td className="py-2 px-4">${parseFloat(d.purchase_amount).toFixed(2)}</td>
                        <td className="py-2 px-4">{parseFloat(d.percentage).toFixed(1)}%</td>
                        <td className="py-2 px-4 font-bold text-brand-green-700">${parseFloat(d.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Links section */}
        <div className="space-y-2">
          <Link
            to="/app/purchases"
            className="bg-white rounded-xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3 flex items-center justify-between hover:bg-brand-green-50 transition-colors"
          >
            <span className="font-bold text-brand-navy-900 text-sm">Mis compras</span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          {(role === 'MERCHANT' || role === 'ADMIN') && (
            <Link
              to="/app/merchant/purchases"
              className="bg-white rounded-xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3 flex items-center justify-between hover:bg-brand-green-50 transition-colors"
            >
              <span className="font-bold text-brand-navy-900 text-sm">Compras pendientes</span>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link
              to="/app/admin/merchants"
              className="bg-white rounded-xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3 flex items-center justify-between hover:bg-brand-green-50 transition-colors"
            >
              <span className="font-bold text-brand-navy-900 text-sm">Panel admin</span>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
