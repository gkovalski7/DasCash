import React from 'react'
import { Link } from 'react-router-dom'
import { fetchPurchases } from '../../lib/api'
import type { ApiPurchase } from '../../lib/api'
import { Card } from '../../components/ui/Card'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-800 border-amber-200' },
    APPROVED: { label: 'Aprobada', className: 'bg-green-50 text-green-800 border-green-200' },
    REJECTED: { label: 'Rechazada', className: 'bg-red-50 text-red-800 border-red-200' },
}

const PAGE_SIZE = 20

export default function MyPurchasesPage() {
    const [purchases, setPurchases] = React.useState<ApiPurchase[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [page, setPage] = React.useState(1)
    const [totalCount, setTotalCount] = React.useState(0)

    React.useEffect(() => {
        setLoading(true)
        fetchPurchases(page, PAGE_SIZE)
            .then(data => { setPurchases(data.results); setTotalCount(data.count) })
            .catch(e => setError(e.message || 'Error al cargar compras'))
            .finally(() => setLoading(false))
    }, [page])

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Compras</h1>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-gray-100" />)}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Compras</h1>
                <Card className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Mis Compras</h1>
                <Link to="/app/stores">
                    <span className="text-sm text-blue-600 hover:underline">+ Nueva compra</span>
                </Link>
            </div>

            {purchases.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-gray-500">Todavía no registraste compras.</p>
                    <Link to="/app/stores" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                        Ir a tiendas para registrar tu primera compra
                    </Link>
                </Card>
            ) : (
                <div className="space-y-3">
                    {purchases.map(p => {
                        const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.PENDING
                        return (
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
                                <span className={`shrink-0 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                                    {st.label}
                                </span>
                            </Card>
                        )
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    )
}
