import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCauses, updateCause, deleteCause, type ApiCause } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminCausesPage() {
    const [causes, setCauses] = useState<ApiCause[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null)
    const [actionSlug, setActionSlug] = useState<string | null>(null)

    async function loadCauses() {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchCauses()
            setCauses(data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCauses() }, [])

    async function handleToggleActive(cause: ApiCause) {
        setActionSlug(cause.slug)
        setFeedback(null)
        try {
            await updateCause(cause.slug, { is_active: !cause.is_active })
            setFeedback({ message: `Causa "${cause.title}" ${cause.is_active ? 'desactivada' : 'activada'}.`, ok: true })
            await loadCauses()
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al cambiar estado', ok: false })
        } finally {
            setActionSlug(null)
        }
    }

    async function handleDelete(cause: ApiCause) {
        if (!confirm(`¿Eliminar la causa "${cause.title}"?`)) return
        setActionSlug(cause.slug)
        setFeedback(null)
        try {
            await deleteCause(cause.slug)
            setFeedback({ message: `Causa "${cause.title}" eliminada.`, ok: true })
            await loadCauses()
        } catch (e: any) {
            setFeedback({ message: e.message || 'Error al eliminar', ok: false })
        } finally {
            setActionSlug(null)
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
                <h2 className="text-lg font-semibold text-gray-900">Causas</h2>
                <Link to="/app/admin/causes/new">
                    <Button className="h-9 px-4 text-sm">+ Nueva Causa</Button>
                </Link>
            </div>

            {feedback && (
                <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {causes.length === 0 ? (
                <Card className="text-center py-8 text-gray-500">No hay causas.</Card>
            ) : (
                <div className="space-y-3">
                    {causes.map(c => (
                        <Card key={c.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">
                                    {c.title}
                                    {!c.is_active && (
                                        <span className="ml-2 inline-block rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
                                            Inactiva
                                        </span>
                                    )}
                                    {c.is_featured && (
                                        <span className="ml-2 inline-block rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-xs text-yellow-700">
                                            Destacada
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {c.category} · {c.slug}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link to={`/app/admin/causes/${c.slug}/edit`} className="text-sm text-blue-600 hover:underline">
                                    Editar
                                </Link>
                                <Button
                                    variant="secondary"
                                    className="h-8 px-3 text-xs"
                                    disabled={actionSlug === c.slug}
                                    onClick={() => handleToggleActive(c)}
                                >
                                    {actionSlug === c.slug ? '...' : c.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={actionSlug === c.slug}
                                    onClick={() => handleDelete(c)}
                                >
                                    {actionSlug === c.slug ? '...' : 'Eliminar'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
