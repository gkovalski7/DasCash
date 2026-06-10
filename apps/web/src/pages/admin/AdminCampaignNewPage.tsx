import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchStores, fetchCauses, fetchCampaign, createCampaign, updateCampaign, type ApiStore, type ApiCause } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function toLocalDatetime(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminCampaignFormPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEdit = Boolean(id)

    const [stores, setStores] = useState<ApiStore[]>([])
    const [causes, setCauses] = useState<ApiCause[]>([])
    const [name, setName] = useState('')
    const [cause, setCause] = useState('')
    const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
    const [percentage, setPercentage] = useState('')
    const [startsAt, setStartsAt] = useState('')
    const [endsAt, setEndsAt] = useState('')
    const [active, setActive] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const promises: Promise<any>[] = [fetchStores(new URLSearchParams({ page_size: '100' })), fetchCauses()]
        if (isEdit && id) promises.push(fetchCampaign(Number(id)))
        Promise.all(promises)
            .then(([s, c, campaign]) => {
                setStores(s.results)
                setCauses(c)
                if (campaign) {
                    setName(campaign.name)
                    setCause(String(campaign.cause))
                    setSelectedStoreIds(campaign.campaign_stores.map((cs: any) => cs.store))
                    setPercentage(campaign.percentage)
                    setStartsAt(toLocalDatetime(campaign.starts_at))
                    setEndsAt(toLocalDatetime(campaign.ends_at))
                    setActive(campaign.active)
                }
            })
            .catch(e => setLoadError(e.message || 'Error al cargar datos'))
    }, [id, isEdit])

    function toggleStore(id: number) {
        setSelectedStoreIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        if (selectedStoreIds.length === 0) {
            setError('Debe seleccionar al menos una tienda.')
            return
        }
        setLoading(true)
        try {
            const payload = {
                name,
                cause: Number(cause),
                store_ids: selectedStoreIds,
                percentage,
                starts_at: new Date(startsAt).toISOString(),
                ends_at: new Date(endsAt).toISOString(),
                active,
            }
            if (isEdit && id) {
                await updateCampaign(Number(id), payload)
            } else {
                await createCampaign(payload)
            }
            navigate('/app/admin/campaigns')
        } catch (err: any) {
            setError(err.message || 'Error al guardar campaña')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEdit ? 'Editar Campaña' : 'Nueva Campaña'}
            </h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                    )}
                    {loadError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{loadError}</div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nombre de la campaña</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ej: Campaña Solidaria Invierno 2026"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Causa</label>
                        <select
                            required
                            value={cause}
                            onChange={e => setCause(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar causa...</option>
                            {causes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.category})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Tiendas ({selectedStoreIds.length} seleccionada{selectedStoreIds.length !== 1 ? 's' : ''})
                        </label>
                        <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                            {stores.length === 0 ? (
                                <p className="text-sm text-gray-400 p-3">No hay tiendas disponibles.</p>
                            ) : (
                                stores.map(s => (
                                    <label
                                        key={s.id}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedStoreIds.includes(s.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStoreIds.includes(s.id)}
                                            onChange={() => toggleStore(s.id)}
                                        />
                                        <span className="text-gray-900">{s.display_name}</span>
                                        {!s.active && <span className="text-xs text-gray-400">(inactiva)</span>}
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Porcentaje de cashback</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            max="100"
                            value={percentage}
                            onChange={e => setPercentage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ej: 5.00"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Inicio</label>
                            <input
                                type="datetime-local"
                                required
                                value={startsAt}
                                onChange={e => setStartsAt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Fin</label>
                            <input
                                type="datetime-local"
                                required
                                value={endsAt}
                                onChange={e => setEndsAt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={e => setActive(e.target.checked)}
                        />
                        Campaña activa
                    </label>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading} className="h-9 px-4 text-sm">
                            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear Campaña'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/app/admin/campaigns')}
                            className="h-9 px-4 text-sm"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
