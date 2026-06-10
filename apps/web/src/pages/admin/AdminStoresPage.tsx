import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchStores, fetchMerchants, updateStore, deleteStore, type ApiStore, type ApiMerchant } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminStoresPage() {
    const [params] = useSearchParams()
    const merchantFilter = params.get('merchant')
    const [stores, setStores] = useState<ApiStore[]>([])
    const [merchants, setMerchants] = useState<Map<number, string>>(new Map())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null)
    const [actionId, setActionId] = useState<number | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const [paginated, merch] = await Promise.all([
                fetchStores(new URLSearchParams({ page_size: '100' })),
                fetchMerchants(),
            ])
            const mid = merchantFilter ? Number(merchantFilter) : null
            setStores(mid ? paginated.results.filter(s => s.merchant === mid) : paginated.results)
            const map = new Map<number, string>()
            merch.forEach((m: ApiMerchant) => map.set(m.id, m.name))
            setMerchants(map)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [merchantFilter])

    async function handleToggleActive(s: ApiStore) {
        setActionId(s.id)
        setFeedback(null)
        try {
            await updateStore(s.id, { active: !s.active })
            setFeedback({ message: `Tienda "${s.display_name}" ${s.active ? 'desactivada' : 'activada'}.`, ok: true })
            await load()
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al cambiar estado', ok: false })
        } finally {
            setActionId(null)
        }
    }

    async function handleDelete(s: ApiStore) {
        if (!confirm(`¿Eliminar la tienda "${s.display_name}"?`)) return
        setActionId(s.id)
        setFeedback(null)
        try {
            await deleteStore(s.id)
            setFeedback({ message: `Tienda "${s.display_name}" eliminada.`, ok: true })
            await load()
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
                <h2 className="text-lg font-semibold text-gray-900">
                    Tiendas{merchantFilter ? ` (Merchant #${merchantFilter})` : ''}
                </h2>
                <Link to="/app/admin/stores/new">
                    <Button className="h-9 px-4 text-sm">+ Nueva Tienda</Button>
                </Link>
            </div>

            {merchantFilter && (
                <Link to="/app/admin/stores" className="inline-block mb-3 text-sm text-blue-600 hover:underline">
                    ← Ver todas las tiendas
                </Link>
            )}

            {feedback && (
                <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {stores.length === 0 ? (
                <Card className="text-center py-8 text-gray-500">No hay tiendas.</Card>
            ) : (
                <div className="space-y-3">
                    {stores.map(s => (
                        <Card key={s.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">
                                    {s.display_name}
                                    {!s.active && (
                                        <span className="ml-2 inline-block rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
                                            Inactiva
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {merchants.get(s.merchant) || `Merchant #${s.merchant}`}
                                    {s.address ? ` · ${s.address}` : ''}
                                    {` · ${s.supported_causes.length} causa(s)`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Link to={`/app/admin/stores/${s.id}/causes`} className="text-sm text-blue-600 hover:underline">
                                    Causas
                                </Link>
                                <Link to={`/app/admin/stores/${s.id}/edit`} className="text-sm text-blue-600 hover:underline">
                                    Editar
                                </Link>
                                <Button
                                    variant="secondary"
                                    className="h-8 px-3 text-xs"
                                    disabled={actionId === s.id}
                                    onClick={() => handleToggleActive(s)}
                                >
                                    {actionId === s.id ? '...' : s.active ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={actionId === s.id}
                                    onClick={() => handleDelete(s)}
                                >
                                    {actionId === s.id ? '...' : 'Eliminar'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
