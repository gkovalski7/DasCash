import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchStore, updateStore } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminStoreEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [displayName, setDisplayName] = useState('')
    const [address, setAddress] = useState('')
    const [qrcodeSlug, setQrcodeSlug] = useState('')
    const [description, setDescription] = useState('')
    const [active, setActive] = useState(true)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStore(Number(id))
            .then(s => {
                setDisplayName(s.display_name)
                setAddress(s.address || '')
                setQrcodeSlug(s.qrcode_slug)
                setDescription(s.description || '')
                setActive(s.active)
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            await updateStore(Number(id), {
                display_name: displayName,
                address: address || undefined,
                qrcode_slug: qrcodeSlug,
                description: description || undefined,
                active,
            })
            navigate('/app/admin/stores')
        } catch (err: any) {
            setError(err.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="animate-pulse h-64 rounded-lg bg-gray-100" />

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar Tienda</h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nombre de la tienda</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Slug QR (único)</label>
                        <input
                            type="text"
                            required
                            value={qrcodeSlug}
                            onChange={e => setQrcodeSlug(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Dirección</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={active}
                            onChange={e => setActive(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-sm text-gray-700">Tienda activa</label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={saving} className="h-9 px-4 text-sm">
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/app/admin/stores')}
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
