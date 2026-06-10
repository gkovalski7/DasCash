import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchStore, createPurchase } from '../../lib/api'
import type { ApiStore } from '../../lib/api'
import CauseSelector from '../../components/CauseSelector'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import CategoryNotice from '../../components/CategoryNotice'

type SubmitState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success' } | { kind: 'error'; message: string }

export default function StoreDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [store, setStore] = React.useState<ApiStore | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // Form state
    const [amount, setAmount] = React.useState('')
    const [source, setSource] = React.useState<'QR' | 'LINK' | 'RECEIPT'>('QR')
    const [selectedCause, setSelectedCause] = React.useState<number | null>(null)
    const [submitState, setSubmitState] = React.useState<SubmitState>({ kind: 'idle' })

    React.useEffect(() => {
        if (!id) return
        setLoading(true)
        fetchStore(Number(id))
            .then(setStore)
            .catch(e => setError(e.message || 'Error al cargar la tienda'))
            .finally(() => setLoading(false))
    }, [id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!store) return

        const causes = store.supported_causes ?? []
        if (causes.length >= 2 && selectedCause === null) {
            setSubmitState({ kind: 'error', message: 'Seleccioná una causa para continuar.' })
            return
        }

        setSubmitState({ kind: 'loading' })
        try {
            await createPurchase({
                store: store.id,
                amount,
                source,
                selected_cause: selectedCause,
            })
            setSubmitState({ kind: 'success' })
            setAmount('')
            setSelectedCause(null)
        } catch (err: any) {
            setSubmitState({ kind: 'error', message: err.message || 'Error al registrar la compra.' })
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-48 rounded-lg bg-gray-100" />
                    <div className="h-6 w-2/3 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
            </div>
        )
    }

    if (error || !store) {
        return (
            <div className="mx-auto max-w-2xl px-6 py-12">
                <Card className="text-center py-8">
                    <p className="text-red-600 font-medium">{error || 'Tienda no encontrada'}</p>
                    <Link to="/app/stores" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                        ← Volver a tiendas
                    </Link>
                </Card>
            </div>
        )
    }

    const causes = store.supported_causes ?? []

    return (
        <div className="mx-auto max-w-2xl px-6 py-8">
            {/* Back link */}
            <Link to="/app/stores" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
                ← Volver a tiendas
            </Link>

            {/* Store info */}
            <Card className="p-0 overflow-hidden mb-6">
                <div className="relative h-48 w-full bg-gray-100">
                    {store.logo_url ? (
                        <img src={store.logo_url} alt={store.display_name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">Sin imagen</div>
                    )}
                </div>
                <div className="p-5">
                    <h1 className="text-xl font-bold text-gray-900">{store.display_name}</h1>
                    {store.description && <p className="mt-2 text-sm text-gray-700">{store.description}</p>}

                    {/* Categories */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {store.categories.map(c => (
                            <span key={c.id} className={`inline-block rounded-full px-2 py-0.5 text-xs border ${c.participates_in_cashback ? 'border-gray-200 text-gray-700' : 'border-amber-300 text-amber-800'}`}>
                                {c.name}{!c.participates_in_cashback ? ' • sin cashback' : ''}
                            </span>
                        ))}
                    </div>

                    {/* Supported causes */}
                    {causes.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Causas que apoya</p>
                            <div className="flex flex-wrap gap-1">
                                {causes.map(c => (
                                    <span key={c.cause_id} className="inline-block rounded-full bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 text-xs">
                                        {c.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {store.has_excluded_categories && store.excluded_categories && store.excluded_categories.length > 0 && (
                        <div className="mt-3">
                            <CategoryNotice categories={store.excluded_categories} />
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        {store.website_url && (
                            <a href={store.website_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" className="h-8 px-3 text-xs">Sitio web</Button>
                            </a>
                        )}
                        {store.instagram_url && (
                            <a href={store.instagram_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" className="h-8 px-3 text-xs">Instagram</Button>
                            </a>
                        )}
                    </div>
                </div>
            </Card>

            {/* Purchase form */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar compra</h2>

                {submitState.kind === 'success' ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                        <p className="text-green-800 font-medium">¡Compra registrada!</p>
                        <p className="text-green-700 text-sm mt-1">Tu compra está pendiente de aprobación. Podés seguir su estado desde "Mis Compras".</p>
                        <div className="mt-4 flex justify-center gap-3">
                            <Button variant="secondary" className="text-sm" onClick={() => setSubmitState({ kind: 'idle' })}>
                                Registrar otra
                            </Button>
                            <Link to="/app/purchases">
                                <Button className="text-sm">Ver mis compras</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                Monto de la compra ($)
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={submitState.kind === 'loading'}
                            />
                        </div>

                        {/* Source */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ¿Cómo realizaste la compra?
                            </label>
                            <div className="flex gap-2">
                                {(['QR', 'LINK', 'RECEIPT'] as const).map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSource(s)}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${source === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                        disabled={submitState.kind === 'loading'}
                                    >
                                        {s === 'QR' ? 'Código QR' : s === 'LINK' ? 'Link' : 'Ticket'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cause selector */}
                        <div>
                            <CauseSelector
                                causes={causes}
                                value={selectedCause}
                                onChange={setSelectedCause}
                                disabled={submitState.kind === 'loading'}
                            />
                        </div>

                        {/* Error */}
                        {submitState.kind === 'error' && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm text-red-700">{submitState.message}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={submitState.kind === 'loading' || !amount}
                        >
                            {submitState.kind === 'loading' ? 'Registrando...' : 'Registrar compra'}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                            Tu compra será revisada y, si hay campaña activa, el cashback se calculará al aprobarse.
                        </p>
                    </form>
                )}
            </Card>
        </div>
    )
}
