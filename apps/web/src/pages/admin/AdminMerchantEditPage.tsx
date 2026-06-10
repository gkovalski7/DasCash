import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchMerchants, updateMerchant, type ApiMerchant } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminMerchantEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [cuit, setCuit] = useState('')
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMerchants()
            .then(merchants => {
                const m = merchants.find((x: ApiMerchant) => x.id === Number(id))
                if (!m) { setError('Merchant no encontrado'); return }
                setName(m.name)
                setCuit(m.cuit)
                setStatus(m.status)
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            await updateMerchant(Number(id), { name, cuit, status })
            navigate('/app/admin/merchants')
        } catch (err: any) {
            setError(err.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="animate-pulse h-48 rounded-lg bg-gray-100" />

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar Merchant</h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nombre del comercio</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">CUIT</label>
                        <input
                            type="text"
                            required
                            value={cuit}
                            onChange={e => setCuit(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="20-12345678-9"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Estado</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={saving} className="h-9 px-4 text-sm">
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/app/admin/merchants')}
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
