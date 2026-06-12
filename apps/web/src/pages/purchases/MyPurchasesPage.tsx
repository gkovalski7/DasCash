import React from 'react'
import { Link } from 'react-router-dom'
import { fetchPurchases } from '../../lib/api'
import type { ApiPurchase } from '../../lib/api'
import ScreenHeader from '../../components/app/ScreenHeader'

const statusTag: Record<string, string> = {
    APPROVED: 'bg-brand-green-50 text-brand-green-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REJECTED: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
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
            <div>
                <ScreenHeader title="Mis compras" />
                <div className="px-4 py-4 animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <ScreenHeader title="Mis compras" />
                <div className="px-4 py-4">
                    <div className="bg-white rounded-2xl text-center py-8 shadow-[0_1px_6px_rgba(10,34,54,0.08)]">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <ScreenHeader title="Mis compras">
                <Link to="/app/stores" className="inline-block mt-1 text-xs text-white/80 hover:text-white">
                    + Nueva compra
                </Link>
            </ScreenHeader>

            <div className="px-4 py-4">
                {purchases.length === 0 ? (
                    <div className="bg-white rounded-2xl text-center py-12 shadow-[0_1px_6px_rgba(10,34,54,0.08)]">
                        <p className="text-gray-500">Todavía no registraste compras.</p>
                        <Link to="/app/stores" className="mt-3 inline-block text-sm text-brand-green-700 hover:underline">
                            Ir a tiendas para registrar tu primera compra
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {purchases.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3.5 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-brand-navy-900 truncate">{p.store_name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>${parseFloat(p.amount).toFixed(2)}</span>
                                        <span>•</span>
                                        <span>{p.source}</span>
                                        {p.cause_title && (
                                            <>
                                                <span>•</span>
                                                <span className="text-brand-green-700">{p.cause_title}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className={`${statusTag[p.status] || statusTag.PENDING} text-xs font-bold px-2 py-0.5 rounded-lg shrink-0`}>
                                    {STATUS_LABELS[p.status] ?? STATUS_LABELS.PENDING}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-brand-green-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-brand-green-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
