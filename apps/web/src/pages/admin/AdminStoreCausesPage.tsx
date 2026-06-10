import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    fetchStore,
    fetchCauses,
    fetchStoreCauses,
    addStoreCause,
    removeStoreCause,
    type ApiStore,
    type ApiCause,
    type ApiStoreSupportedCause,
} from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminStoreCausesPage() {
    const { id } = useParams<{ id: string }>()
    const storeId = Number(id)
    const [store, setStore] = useState<ApiStore | null>(null)
    const [supported, setSupported] = useState<ApiStoreSupportedCause[]>([])
    const [allCauses, setAllCauses] = useState<ApiCause[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null)
    const [actionId, setActionId] = useState<number | null>(null)

    async function loadData() {
        setLoading(true)
        setError(null)
        try {
            const [s, sc, causes] = await Promise.all([
                fetchStore(storeId),
                fetchStoreCauses(storeId),
                fetchCauses(),
            ])
            setStore(s)
            setSupported(sc)
            setAllCauses(causes)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [storeId])

    const supportedIds = new Set(supported.map(s => s.cause_id))
    const available = allCauses.filter(c => !supportedIds.has(c.id))

    async function handleAdd(causeId: number) {
        setActionId(causeId)
        setFeedback(null)
        try {
            await addStoreCause(storeId, causeId)
            setFeedback({ message: 'Causa asociada correctamente.', ok: true })
            const sc = await fetchStoreCauses(storeId)
            setSupported(sc)
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al asociar causa', ok: false })
        } finally {
            setActionId(null)
        }
    }

    async function handleRemove(causeId: number) {
        setActionId(causeId)
        setFeedback(null)
        try {
            await removeStoreCause(storeId, causeId)
            setFeedback({ message: 'Causa desasociada correctamente.', ok: true })
            const sc = await fetchStoreCauses(storeId)
            setSupported(sc)
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al desasociar causa', ok: false })
        } finally {
            setActionId(null)
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-8 w-1/3 rounded bg-gray-200" />
                <div className="h-24 rounded-lg bg-gray-100" />
                <div className="h-24 rounded-lg bg-gray-100" />
            </div>
        )
    }

    if (error) return <Card className="text-red-600">{error}</Card>

    return (
        <div>
            <Link to="/app/admin/stores" className="inline-block mb-3 text-sm text-blue-600 hover:underline">
                ← Volver a tiendas
            </Link>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Causas de {store?.display_name || `Tienda #${storeId}`}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Gestiona las causas que apoya esta tienda.</p>

            {feedback && (
                <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                >
                    {feedback.message}
                </div>
            )}

            <h3 className="text-sm font-medium text-gray-700 mb-2">
                Causas asociadas ({supported.length})
            </h3>
            {supported.length === 0 ? (
                <Card className="text-sm text-gray-500 mb-6">Esta tienda no tiene causas asociadas.</Card>
            ) : (
                <div className="space-y-2 mb-6">
                    {supported.map(sc => (
                        <Card key={sc.cause_id} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{sc.title}</p>
                                <p className="text-xs text-gray-500">{sc.category}</p>
                            </div>
                            <Button
                                variant="secondary"
                                className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                disabled={actionId === sc.cause_id}
                                onClick={() => handleRemove(sc.cause_id)}
                            >
                                {actionId === sc.cause_id ? '...' : 'Quitar'}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            <h3 className="text-sm font-medium text-gray-700 mb-2">
                Causas disponibles ({available.length})
            </h3>
            {available.length === 0 ? (
                <Card className="text-sm text-gray-500">Todas las causas ya están asociadas.</Card>
            ) : (
                <div className="space-y-2">
                    {available.map(c => (
                        <Card key={c.id} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                                <p className="text-xs text-gray-500">{c.category}</p>
                            </div>
                            <Button
                                className="h-8 px-3 text-xs"
                                disabled={actionId === c.id}
                                onClick={() => handleAdd(c.id)}
                            >
                                {actionId === c.id ? '...' : 'Agregar'}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
