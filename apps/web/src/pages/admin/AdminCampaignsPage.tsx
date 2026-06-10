import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCampaigns, deleteCampaign, type ApiCampaign } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<ApiCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null)
    const [actionId, setActionId] = useState<number | null>(null)

    async function loadCampaigns() {
        setLoading(true)
        setError(null)
        try {
            setCampaigns(await fetchCampaigns())
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCampaigns() }, [])

    async function handleDelete(c: ApiCampaign) {
        if (!confirm(`¿Eliminar la campaña "${c.name}"?`)) return
        setActionId(c.id)
        setFeedback(null)
        try {
            await deleteCampaign(c.id)
            setFeedback({ message: `Campaña "${c.name}" eliminada.`, ok: true })
            await loadCampaigns()
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al eliminar', ok: false })
        } finally {
            setActionId(null)
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-gray-100" />)}
            </div>
        )
    }

    if (error) return <Card className="text-red-600">{error}</Card>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
                <Link to="/app/admin/campaigns/new">
                    <Button className="h-9 px-4 text-sm">+ Nueva Campaña</Button>
                </Link>
            </div>

            {feedback && (
                <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {campaigns.length === 0 ? (
                <Card className="text-center py-8 text-gray-500">No hay campañas.</Card>
            ) : (
                <div className="space-y-3">
                    {campaigns.map(c => (
                        <Card key={c.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{c.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Causa: {c.cause_title} · {c.percentage}% ·{' '}
                                        {new Date(c.starts_at).toLocaleDateString('es-AR')} –{' '}
                                        {new Date(c.ends_at).toLocaleDateString('es-AR')}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Tiendas: {c.campaign_stores.map(cs => cs.store_name).join(', ') || 'Ninguna'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.active
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}
                                    >
                                        {c.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                    <Link to={`/app/admin/campaigns/${c.id}/edit`}>
                                        <Button variant="secondary" className="h-8 px-3 text-xs">
                                            Editar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="secondary"
                                        className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={actionId === c.id}
                                        onClick={() => handleDelete(c)}
                                    >
                                        {actionId === c.id ? '...' : 'Eliminar'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
