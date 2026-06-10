import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMerchants, deleteMerchant, fetchUsers, type ApiMerchant, type ApiUser } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<ApiMerchant[]>([])
    const [users, setUsers] = useState<Map<number, ApiUser>>(new Map())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null)
    const [actionId, setActionId] = useState<number | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const [merch, usrs] = await Promise.all([fetchMerchants(), fetchUsers('MERCHANT')])
            setMerchants(merch)
            const map = new Map<number, ApiUser>()
            usrs.forEach(u => map.set(u.id, u))
            setUsers(map)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    async function handleDelete(m: ApiMerchant) {
        if (!confirm(`¿Eliminar el merchant "${m.name}"? Se eliminarán todas sus tiendas.`)) return
        setActionId(m.id)
        setFeedback(null)
        try {
            await deleteMerchant(m.id)
            setFeedback({ message: `Merchant "${m.name}" eliminado.`, ok: true })
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
                <h2 className="text-lg font-semibold text-gray-900">Merchants</h2>
                <Link to="/app/admin/merchants/new">
                    <Button className="h-9 px-4 text-sm">+ Nuevo Merchant</Button>
                </Link>
            </div>

            {feedback && (
                <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {merchants.length === 0 ? (
                <Card className="text-center py-8 text-gray-500">No hay merchants creados.</Card>
            ) : (
                <div className="space-y-3">
                    {merchants.map(m => {
                        const owner = users.get(m.owner)
                        return (
                            <Card key={m.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{m.name}</p>
                                    <p className="text-sm text-gray-500">
                                        CUIT: {m.cuit} · Estado: {m.status}
                                        {owner ? ` · Owner: ${owner.email}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link to={`/app/admin/stores?merchant=${m.id}`} className="text-sm text-blue-600 hover:underline">
                                        Ver tiendas
                                    </Link>
                                    <Link to={`/app/admin/merchants/${m.id}/edit`} className="text-sm text-blue-600 hover:underline">
                                        Editar
                                    </Link>
                                    <Button
                                        variant="secondary"
                                        className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={actionId === m.id}
                                        onClick={() => handleDelete(m)}
                                    >
                                        {actionId === m.id ? '...' : 'Eliminar'}
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
