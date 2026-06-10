import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMerchants, createStore, type ApiMerchant } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminStoreNewPage() {
    const navigate = useNavigate()
    const [merchants, setMerchants] = useState<ApiMerchant[]>([])
    const [merchant, setMerchant] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [address, setAddress] = useState('')
    const [qrcodeSlug, setQrcodeSlug] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        fetchMerchants()
            .then(setMerchants)
            .catch(e => setLoadError(e.message || 'Error al cargar merchants'))
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await createStore({
                merchant: Number(merchant),
                display_name: displayName,
                address: address || undefined,
                qrcode_slug: qrcodeSlug,
                description: description || undefined,
            })
            navigate('/app/admin/stores')
        } catch (err: any) {
            setError(err.message || 'Error al crear tienda')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva Tienda</h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                    )}
                    {loadError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{loadError}</div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Merchant</label>
                        <select
                            required
                            value={merchant}
                            onChange={e => setMerchant(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar merchant...</option>
                            {merchants.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (CUIT: {m.cuit})
                                </option>
                            ))}
                        </select>
                    </div>

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
                            placeholder="ej: mi-tienda"
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

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading} className="h-9 px-4 text-sm">
                            {loading ? 'Creando...' : 'Crear Tienda'}
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
