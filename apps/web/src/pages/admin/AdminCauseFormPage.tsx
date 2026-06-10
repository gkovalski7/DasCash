import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCause, updateCause, fetchCauseBySlug } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

const CATEGORY_OPTIONS = ['Deporte', 'Educación', 'Salud', 'Ambiente']

export default function AdminCauseFormPage() {
    const navigate = useNavigate()
    const { slug } = useParams<{ slug: string }>()
    const isEdit = Boolean(slug)

    const [title, setTitle] = useState('')
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
    const [summary, setSummary] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [isFeatured, setIsFeatured] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isEdit && slug) {
            setLoading(true)
            fetchCauseBySlug(slug)
                .then(c => {
                    setTitle(c.title)
                    setCategory(c.category)
                    setSummary(c.summary || '')
                    setImageUrl(c.image_url || '')
                    setIsActive(c.is_active)
                    setIsFeatured(c.is_featured)
                })
                .catch(e => setLoadError(e.message))
                .finally(() => setLoading(false))
        }
    }, [slug, isEdit])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const data = {
                title,
                category,
                summary: summary || undefined,
                image_url: imageUrl || undefined,
                is_active: isActive,
                is_featured: isFeatured,
            }
            if (isEdit && slug) {
                await updateCause(slug, data)
            } else {
                await createCause(data)
            }
            navigate('/app/admin/causes')
        } catch (err: any) {
            setError(err.message || 'Error al guardar causa')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEdit ? 'Editar Causa' : 'Nueva Causa'}
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
                        <label className="block text-sm text-gray-600 mb-1">Título</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                        <select
                            required
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {CATEGORY_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Resumen</label>
                        <textarea
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">URL de imagen</label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                            Activa
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={e => setIsFeatured(e.target.checked)}
                            />
                            Destacada
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading} className="h-9 px-4 text-sm">
                            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear Causa'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/app/admin/causes')}
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
