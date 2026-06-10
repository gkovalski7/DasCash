import React, { useEffect, useMemo, useState } from 'react'
import { getProfile, getProfileDonations, patchProfile, type ApiProfile, type ApiDonation } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-white pt-6 pb-12">
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen de tu impacto.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (<div key={i} className="h-24 rounded-lg bg-gray-100" />))}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>
        )}

        {/* Profile info + edit */}
        {!loading && profile && (
          <>
            <Card className="mb-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-gray-600">{profile.email}</p>
                  {!editing ? (
                    <p className="text-lg font-semibold text-gray-900">
                      {profile.first_name || profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`.trim()
                        : profile.username}
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-600">Nombre</label>
                        <input value={editFirst} onChange={e => setEditFirst(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Apellido</label>
                        <input value={editLast} onChange={e => setEditLast(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <Button onClick={saveEdit} disabled={saving} className="h-8 px-3 text-sm">{saving ? 'Guardando...' : 'Guardar'}</Button>
                      <Button variant="secondary" onClick={() => setEditing(false)} className="h-8 px-3 text-sm">Cancelar</Button>
                    </div>
                  )}
                  <span className="inline-block mt-1 text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">{profile.role}</span>
                </div>
                {!editing && (
                  <Button variant="secondary" onClick={startEdit} className="h-9 px-3 text-sm">Editar perfil</Button>
                )}
              </div>
            </Card>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-gray-600">Total donado</div>
                <div className="text-2xl font-semibold text-gray-900">${parseFloat(profile.total_donated).toFixed(2)}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Causas apoyadas</div>
                <div className="text-2xl font-semibold text-gray-900">{profile.causes_count}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Compras registradas</div>
                <div className="text-2xl font-semibold text-gray-900">{profile.purchases_count}</div>
              </Card>
            </div>
          </>
        )}

        {/* Donaciones por causa */}
        {!loading && !!topByCause.length && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Donaciones por causa</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Causa</th>
                    <th className="py-2">Donado</th>
                  </tr>
                </thead>
                <tbody>
                  {topByCause.map(([c, v]) => (
                    <tr key={c} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{c}</td>
                      <td className="py-2">${(v as number).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        {!loading && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Actividad reciente</h2>
            {donations.length === 0 ? (
              <div className="text-gray-500 py-6 text-center">
                <p className="text-lg">Sin donaciones aún</p>
                <p className="text-sm mt-1">Cuando hagas compras y se aprueben, tus donaciones aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Comercio</th>
                      <th className="py-2 pr-4">Causa</th>
                      <th className="py-2 pr-4">Compra</th>
                      <th className="py-2 pr-4">%</th>
                      <th className="py-2">Donado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id} className="border-t border-gray-100">
                        <td className="py-2 pr-4">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{d.store_name}</td>
                        <td className="py-2 pr-4">{d.cause_title}</td>
                        <td className="py-2 pr-4">${parseFloat(d.purchase_amount).toFixed(2)}</td>
                        <td className="py-2 pr-4">{parseFloat(d.percentage).toFixed(1)}%</td>
                        <td className="py-2">${parseFloat(d.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
