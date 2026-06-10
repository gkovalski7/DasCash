import React from 'react'
import { fetchPurchases, approvePurchase } from '../../lib/api'
import type { ApiPurchase } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function PendingPurchasesPage() {
    const [purchases, setPurchases] = React.useState<ApiPurchase[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [approvingId, setApprovingId] = React.useState<number | null>(null)
    const [feedback, setFeedback] = React.useState<{ id: number; message: string; ok: boolean } | null>(null)

    function loadPurchases() {
        setLoading(true)
        fetchPurchases(1, 100)
            .then(data => setPurchases(data.results))
            .catch(e => setError(e.message || 'Error al cargar compras'))
            .finally(() => setLoading(false))
    }

    React.useEffect(() => { loadPurchases() }, [])

    async function handleApprove(id: number) {
        setApprovingId(id)
        setFeedback(null)
        try {
            const result = await approvePurchase(id)
            setFeedback({ id, message: result.detail, ok: true })
            // Refresh list
            const updated = await fetchPurchases(1, 100)
            setPurchases(updated.results)
        } catch (err: any) {
            setFeedback({ id, message: err.message || 'Error al aprobar', ok: false })
        } finally {
            setApprovingId(null)
        }
    }

    const pending = purchases.filter(p => p.status === 'PENDING')
    const processed = purchases.filter(p => p.status !== 'PENDING')

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Compras pendientes</h1>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-gray-100" />)}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Compras pendientes</h1>
                <Card className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button onClick={loadPurchases} className="mt-3 text-sm text-blue-600 hover:underline">Reintentar</button>
                </Card>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Compras pendientes</h1>

            {/* Feedback banner */}
            {feedback && (
                <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {/* Pending section */}
            {pending.length === 0 ? (
                <Card className="text-center py-12 mb-8">
                    <p className="text-gray-500">No hay compras pendientes de aprobación.</p>
                </Card>
            ) : (
                <div className="space-y-3 mb-8">
                    {pending.map(p => (
                        <Card key={p.id} className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.store_name}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span>${parseFloat(p.amount).toFixed(2)}</span>
                                    <span>•</span>
                                    <span>{p.source}</span>
                                    {p.cause_title && (
                                        <>
                                            <span>•</span>
                                            <span className="text-green-700">{p.cause_title}</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <Button
                                className="shrink-0 h-9 px-4 text-sm"
                                disabled={approvingId === p.id}
                                onClick={() => handleApprove(p.id)}
                            >
                                {approvingId === p.id ? 'Aprobando...' : 'Aprobar'}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Processed section */}
            {processed.length > 0 && (
                <>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Procesadas</h2>
                    <div className="space-y-3">
                        {processed.map(p => (
                            <Card key={p.id} className="flex items-center justify-between gap-4 opacity-75">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{p.store_name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>${parseFloat(p.amount).toFixed(2)}</span>
                                        <span>•</span>
                                        <span>{p.source}</span>
                                        {p.cause_title && (
                                            <>
                                                <span>•</span>
                                                <span className="text-green-700">{p.cause_title}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className={`shrink-0 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${p.status === 'APPROVED' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                    {p.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                                </span>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
